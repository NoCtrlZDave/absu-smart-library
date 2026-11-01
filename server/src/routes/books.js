import express from 'express';
import { body } from 'express-validator';
import mongoose from 'mongoose';
import Book from '../models/Book.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload, uploadToCloudinary } from '../middleware/upload.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, badRequest, notFound } from '../utils/responses.js';
import logActivity from '../utils/audit.js';
import { generateBarcodeSvg, generateQrDataUrl } from '../services/barcode.js';
import { CATALOGUE_ROLES } from '../services/policies.js';
import { previewBookImport, importBookRows, BOOK_IMPORT_TEMPLATE_HEADERS } from '../services/bookImport.js';
import { PERMISSIONS } from '../config/permissions.js';
import { requirePermission } from '../middleware/auth.js';

const router = express.Router();

const normalizeCopies = (raw) => {
  if (!Array.isArray(raw) || !raw.length) return [];
  return raw.map((c, i) => {
    const rawLoc = c.location;
    const isStringLoc = typeof rawLoc === 'string' && rawLoc.trim();
    const loc = isStringLoc ? {} : rawLoc || {};
    return {
      code: c.id || c.code || `CP-${i + 1}`,
      accessionNumber: c.accessionNumber || null,
      callNumber: c.callNumber || null,
      copyNumber: c.copyNumber || null,
      status: c.status || 'available',
      borrower: c.borrower || null,
      dueDate: c.dueDate || null,
      reservedBy: c.reservedBy || null,
      location: {
        library: loc.library || 'Main Library',
        floor: loc.floor || null,
        section: loc.section || null,
        rack: loc.rack || null,
        shelf: loc.shelf || null,
      },
      locationString: isStringLoc ? rawLoc.trim() : null,
      rfidTag: c.rfidTag || null,
      condition: c.condition || 'good',
    };
  });
};

const normalizeBookPayload = (body) => {
  const authors = Array.isArray(body.authors) && body.authors.length
    ? body.authors
    : typeof body.author === 'string' && body.author.trim()
      ? body.author.split(',').map((a) => a.trim()).filter(Boolean)
      : [];

  const physical = body.physicalDescription || null;
  const loc = body.location || {};
  const cat = body.cataloguing && typeof body.cataloguing === 'object' && !Array.isArray(body.cataloguing)
    ? body.cataloguing
    : body;

  return {
    title: body.title,
    subtitle: body.subtitle || null,
    edition: body.edition || null,
    authors,
    isbn: body.isbn || null,
    publisher: body.publisher || null,
    placeOfPublication: body.placeOfPublication || body.place || null,
    year: body.year ? Number(body.year) : null,
    category: body.category || 'General',
    department: body.department || null,
    ddcNumber: body.ddcNumber || null,
    description: body.description || null,
    subjects: Array.isArray(body.subjects) ? body.subjects : (body.subjects ? String(body.subjects).split(',').map((s) => s.trim()) : []),
    keywords: Array.isArray(body.keywords) ? body.keywords : [],
    physicalDescription: physical || body.notesPagination || null,
    notes: Array.isArray(body.notes) ? body.notes : (body.notes ? [body.notes] : []),
    format: body.format || null,
    coverImage: body.coverImage || null,
    cataloguing: {
      cataloguedBy: cat.cataloguedBy || null,
      cataloguedDate: cat.cataloguedDate || null,
      checkedBy: cat.checkedBy || null,
      checkedDate: cat.checkedDate || null,
      originalCataloguing: Boolean(cat.originalCataloguing),
      cip: cat.cip || null,
      tracings: Array.isArray(cat.tracings) ? cat.tracings : [],
      crossReferences: Array.isArray(cat.crossReferences) ? cat.crossReferences : [],
    },
    location: {
      library: loc.library || 'Main Library',
      floor: loc.floor || null,
      section: loc.section || null,
      rack: loc.rack || null,
      shelf: loc.shelf || null,
    },
    copies: normalizeCopies(body.copies),
  };
};

const SEARCH_PATHS = {
  all: [
    'title', 'subtitle', 'authors', 'isbn', 'publisher', 'category', 'department',
    'placeOfPublication', 'description', 'subjects', 'keywords', 'notes',
    'cataloguing.cataloguedBy', 'cataloguing.tracings', 'cataloguing.crossReferences',
    'copies.callNumber', 'copies.accessionNumber', 'copies.code',
    'ddcNumber',
  ],
  title: ['title', 'subtitle'],
  author: ['authors'],
  subject: ['subjects', 'keywords'],
  isbn: ['isbn', 'copies.accessionNumber'],
  callnumber: ['copies.callNumber', 'copies.code'],
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const escapeSearch = (str, { startsWith = false } = {}) =>
  new RegExp(`${startsWith ? '^' : ''}${escapeRegex(str)}`, 'i');

const scoreBook = (book, term) => {
  const t = String(term).toLowerCase();
  const strHit = (value, weight) => {
    if (value === undefined || value === null || value === '') return 0;
    const s = String(value).toLowerCase();
    if (s === t) return 3 * weight;
    if (s.startsWith(t)) return 2 * weight;
    if (s.includes(t)) return weight;
    return 0;
  };
  const arrHit = (arr, weight) =>
    Array.isArray(arr) ? arr.reduce((max, v) => Math.max(max, strHit(v, weight)), 0) : 0;
  const copyHit = (key, weight) =>
    Array.isArray(book.copies)
      ? book.copies.reduce((max, c) => Math.max(max, strHit(c[key], weight)), 0)
      : 0;

  return (
    strHit(book.title, 50) +
    strHit(book.subtitle, 25) +
    arrHit(book.authors, 30) +
    arrHit(book.subjects, 25) +
    arrHit(book.keywords, 20) +
    strHit(book.isbn, 15) +
    strHit(book.publisher, 8) +
    strHit(book.category, 6) +
    strHit(book.description, 4) +
    arrHit(book.notes, 3) +
    copyHit('callNumber', 20) +
    copyHit('accessionNumber', 12) +
    copyHit('code', 8)
  );
};

const groupCounts = (docs, key) => {
  const map = new Map();
  docs.forEach((d) => {
    const val = d[key];
    if (val === undefined || val === null || val === '') return;
    map.set(String(val), (map.get(String(val)) || 0) + 1);
  });
  return Array.from(map.entries()).map(([name, count]) => ({ name, count }));
};

router.get('/', asyncHandler(async (req, res) => {
  const {
    q, field, category, format, year, author, department, subject, isbn, availability, sort, page = 1, limit = 12,
  } = req.query;
  const search = String(q || '').trim();
  const searchField = ['title', 'author', 'subject', 'isbn', 'callnumber'].includes(field) ? field : 'all';
  const filter = {};

  if (search) {
    const paths = SEARCH_PATHS[searchField] || SEARCH_PATHS.all;
    const startsWith = searchField === 'callnumber';
    const rx = escapeSearch(search, { startsWith });
    filter.$or = paths.map((p) => ({ [p]: rx }));
  }
  if (category) filter.category = escapeSearch(String(category));
  if (format) filter.format = format;
  if (year) filter.year = Number(year);
  if (author) filter.authors = escapeSearch(String(author));
  if (department) filter.department = escapeSearch(String(department));
  if (subject) filter.subjects = escapeSearch(String(subject));
  if (isbn) filter.isbn = escapeSearch(String(isbn).replace(/[^0-9Xx]/g, ''));

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const perPage = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

  let docs = await Book.find(filter).lean();

  // Relevance scoring (only for scoped matches)
  if (search) {
    docs.forEach((d) => { d._srch = scoreBook(d, search); });
    docs = docs.filter((d) => d._srch > 0);
  }

  // Facets: full scope minus category/format so they can be drilled down
  const facetScope = { ...filter };
  delete facetScope.category;
  delete facetScope.format;
  delete facetScope.department;
  const facetDocs = await Book.find(facetScope).lean();
  const isAvailable = (d) => (d.copies || []).some((c) => c.status === 'available' || c.status === 'verified');
  const facets = {
    total: facetDocs.length,
    available: facetDocs.filter(isAvailable).length,
    categories: groupCounts(facetDocs, 'category'),
    formats: groupCounts(facetDocs, 'format'),
    departments: groupCounts(facetDocs, 'department'),
    subjects: groupCounts(facetDocs, 'subjects'),
    years: groupCounts(facetDocs, 'year').map((y) => ({ year: Number(y.name), count: y.count })).sort((a, b) => b.year - a.year).slice(0, 15),
  };

  // Availability filter
  if (availability === 'available') {
    docs = docs.filter(isAvailable);
  } else if (availability === 'borrowed') {
    docs = docs.filter((d) => !isAvailable(d));
  }

  // Sorting
  const sortRaw = String(sort || 'relevance');
  if (sortRaw === 'relevance') {
    if (search) docs.sort((a, b) => b._srch - a._srch || String(a.title).localeCompare(String(b.title)));
    else docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortRaw === 'title') {
    docs.sort((a, b) => String(a.title).localeCompare(String(b.title)));
  } else if (sortRaw === 'year') {
    docs.sort((a, b) => (b.year || 0) - (a.year || 0));
  } else if (sortRaw === 'author') {
    docs.sort((a, b) => String(a.author || '').localeCompare(String(b.author || '')));
  } else {
    docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  const total = docs.length;
  const totalPages = Math.ceil(total / perPage);
  const slice = docs.slice((pageNum - 1) * perPage, pageNum * perPage);

  return ok(res, {
    books: slice.map((d) => new Book(d).toCatalogueJSON()),
    pagination: {
      page: pageNum,
      limit: perPage,
      total,
      totalPages,
    },
    facets,
    applied: {
      query: search,
      field: searchField,
      category: category || '',
      format: format || '',
      year: year || '',
      author: author || '',
      department: department || '',
      subject: subject || '',
      isbn: isbn || '',
      availability: availability || 'all',
      sort: sortRaw,
    },
  });
}));

router.get('/categories', asyncHandler(async (req, res) => {
  const agg = await Book.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return ok(res, agg.map((a) => ({ name: a._id || 'General', count: a.count })));
}));

router.get('/import/template', protect, authorize(...CATALOGUE_ROLES), (req, res) => {
  const csv = `${BOOK_IMPORT_TEMPLATE_HEADERS.join(',')}\n`;
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="absu-book-import-template.csv"');
  return res.send(`\uFEFF${csv}`);
});

router.post('/import/preview', protect, authorize(...CATALOGUE_ROLES), requirePermission(PERMISSIONS.CATALOGUE_IMPORT), asyncHandler(async (req, res) => {
  const { rows, mapping } = req.body;
  const validation = await previewBookImport(rows, { mapping });
  if (validation.error) return badRequest(res, validation.error);

  const summary = {
    total: validation.rows.length,
    ready: validation.rows.filter((row) => row.status === 'ready').length,
    invalid: validation.rows.filter((row) => row.status === 'invalid').length,
    duplicate: validation.rows.filter((row) => row.status === 'duplicate').length,
  };
  return ok(res, { rows: validation.rows, summary }, 'Book import preview generated');
}));

router.post('/import', protect, authorize(...CATALOGUE_ROLES), requirePermission(PERMISSIONS.CATALOGUE_IMPORT), asyncHandler(async (req, res) => {
  const { rows, mapping } = req.body;
  const result = await importBookRows(rows, req.user, { mapping });
  if (result.error) return badRequest(res, result.error);

  await logActivity({
    actor: req.user,
    action: 'BOOKS_BULK_IMPORTED',
    entity: 'Book',
    details: result.summary,
  });
  return ok(res, { rows: result.rows, summary: result.summary }, 'Book import completed');
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  let book;
  if (mongoose.isValidObjectId(id)) {
    book = await Book.findById(id);
  } else {
    book = await Book.findOne({ isbn: id });
  }
  if (!book) return notFound(res, 'Book not found');
  return ok(res, book.toCatalogueJSON());
}));

router.post(
  '/',
  protect,
  authorize(...CATALOGUE_ROLES),
  [body('title').notEmpty().withMessage('Title is required')],
  asyncHandler(async (req, res) => {
    if (!req.body.title) return badRequest(res, 'Title is required');
    const payload = normalizeBookPayload(req.body);
    payload.createdBy = req.user._id;
    const book = await Book.create(payload);
    await logActivity({ actor: req.user, action: 'BOOK_CREATED', entity: 'Book', entityId: book._id });
    return created(res, book.toCatalogueJSON(), 'Book added successfully');
  })
);

router.put(
  '/:id',
  protect,
  authorize(...CATALOGUE_ROLES),
  asyncHandler(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) return notFound(res, 'Book not found');
    const payload = normalizeBookPayload(req.body);
    payload.updatedBy = req.user._id;
    Object.assign(book, payload);
    await book.save();
    await logActivity({ actor: req.user, action: 'BOOK_UPDATED', entity: 'Book', entityId: book._id });
    return ok(res, book.toCatalogueJSON(), 'Book updated successfully');
  })
);

router.delete(
  '/:id',
  protect,
  authorize(...CATALOGUE_ROLES),
  asyncHandler(async (req, res) => {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return notFound(res, 'Book not found');
    await logActivity({ actor: req.user, action: 'BOOK_DELETED', entity: 'Book', entityId: req.params.id });
    return ok(res, null, 'Book deleted');
  })
);

router.post(
  '/:id/cover',
  protect,
  authorize(...CATALOGUE_ROLES),
  upload.single('cover'),
  asyncHandler(async (req, res) => {
    if (!req.file) return badRequest(res, 'No cover image uploaded');
    const book = await Book.findById(req.params.id);
    if (!book) return notFound(res, 'Book not found');
    const result = await uploadToCloudinary(req.file.buffer, `absu-library/books/${book._id}`);
    book.coverImage = result.secure_url;
    await book.save();
    await logActivity({ actor: req.user, action: 'BOOK_COVER_UPLOADED', entity: 'Book', entityId: book._id });
    return ok(res, { coverImage: result.secure_url, publicId: result.public_id }, 'Cover uploaded');
  })
);

router.get('/:id/copies/:copyId/barcode', protect, authorize(...CATALOGUE_ROLES), asyncHandler(async (req, res) => {
  const { id, copyId } = req.params;
  const book = await Book.findById(id);
  if (!book) return notFound(res, 'Book not found');
  const copy = (book.copies || []).find((c) => String(c._id) === String(copyId)) || null;
  const value = copy?.accessionNumber || copy?.code || copyId;
  const svg = generateBarcodeSvg(value);
  if (!svg) return notFound(res, 'Copy barcode not found');
  res.set('Content-Type', 'image/svg+xml');
  return res.send(svg);
}));

router.get('/:id/copies/:copyId/qr', protect, authorize(...CATALOGUE_ROLES), asyncHandler(async (req, res) => {
  const { id, copyId } = req.params;
  const book = await Book.findById(id);
  if (!book) return notFound(res, 'Book not found');
  const copy = (book.copies || []).find((c) => String(c._id) === String(copyId)) || null;
  const value = copy?.accessionNumber || copy?.code || copyId;
  const dataUrl = await generateQrDataUrl(value);
  const base64 = dataUrl.split(',')[1];
  res.set('Content-Type', 'image/png');
  return res.send(Buffer.from(base64, 'base64'));
}));

export default router;