import Book from '../models/Book.js';
import { isValidIsbn, normalizeIsbn } from './isbn.js';

export const BOOK_IMPORT_TEMPLATE_HEADERS = [
  'Title',
  'Author(s)',
  'ISBN',
  'Publisher',
  'Publication Year',
  'Category',
  'Department',
  'Subject',
  'Call Number',
  'Copies',
  'Shelf Location',
  'Remarks',
];

const MAX_ROWS = 2000;

const text = (value) => (value === undefined || value === null ? '' : String(value).trim());

const pick = (row, keys, mapping, field) => {
  if (mapping && mapping[field]) {
    const value = row[mapping[field]];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }
  return '';
};

export const normalizeBookRow = (raw = {}, mapping) => {
  const authorRaw = text(
    pick(raw, ['authors', 'author', 'Author', 'Author(s)', 'Authors', 'authorNames'], mapping, 'authors')
  );
  const authors = authorRaw
    ? authorRaw.split(/\s*(?:;|\band\b|&)\s*/i).flatMap((part) => part.split(',')).map((a) => a.trim()).filter(Boolean)
    : [];

  const subjectRaw = text(pick(raw, ['subject', 'Subject', 'Subjects', 'subjectArea'], mapping, 'subject'));
  const subjects = subjectRaw
    ? subjectRaw.split(/[;,]/).map((s) => s.trim()).filter(Boolean)
    : [];

  const copiesRaw = text(pick(raw, ['copies', 'Copies', 'quantity', 'Quantity', 'No. of Copies'], mapping, 'copies'));
  const copies = copiesRaw ? Number(copiesRaw) : 1;

  const yearRaw = text(pick(raw, ['year', 'Year', 'Publication Year', 'publicationYear', 'pubYear'], mapping, 'year'));
  const year = yearRaw ? Number(yearRaw) : null;

  return {
    title: text(pick(raw, ['title', 'Title', 'Book Title', 'bookTitle'], mapping, 'title')),
    authors,
    isbn: normalizeIsbn(pick(raw, ['isbn', 'ISBN', 'Isbn', 'ISBN Number'], mapping, 'isbn')),
    publisher: text(pick(raw, ['publisher', 'Publisher'], mapping, 'publisher')) || null,
    placeOfPublication:
      text(pick(raw, ['place', 'Place', 'Place of Publication', 'placeOfPublication'], mapping, 'placeOfPublication')) || null,
    year: Number.isFinite(year) ? year : null,
    category: text(pick(raw, ['category', 'Category', 'Subject Category'], mapping, 'category')) || 'General',
    department: text(pick(raw, ['department', 'Department', 'Faculty'], mapping, 'department')) || null,
    subjects,
    callNumber: text(pick(raw, ['callNumber', 'Call Number', 'callNo', 'DDC', 'Classification Number'], mapping, 'callNumber')) || null,
    copies: Number.isFinite(copies) ? copies : 1,
    shelfLocation:
      text(pick(raw, ['shelf', 'Shelf', 'Shelf Location', 'location', 'Location'], mapping, 'shelfLocation')) || null,
    remarks: text(pick(raw, ['remarks', 'Remarks', 'notes', 'Notes'], mapping, 'remarks')) || null,
  };
};

const titleKey = (title, authors) =>
  `${String(title || '').toLowerCase().replace(/\s+/g, ' ').trim()}|${String(authors?.[0] || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()}`;

export const validateBookRows = async (rows, { mapping, skipDatabaseDuplicates = false } = {}) => {
  if (!Array.isArray(rows) || !rows.length) return { error: 'rows must be a non-empty array' };
  if (rows.length > MAX_ROWS) return { error: `A maximum of ${MAX_ROWS} rows can be imported at once` };

  const normalized = rows.map((row, index) => ({
    rowNumber: index + 1,
    ...normalizeBookRow(row || {}, mapping),
  }));

  const isbns = normalized.map((row) => row.isbn).filter(Boolean);
  const existingBooks = skipDatabaseDuplicates
    ? []
    : await Book.find({
        $or: [
          { isbn: { $in: isbns } },
          { title: { $in: normalized.map((row) => row.title).filter(Boolean) } },
        ],
      })
        .select('title isbn authors')
        .lean();

  const existingIsbns = new Set(existingBooks.map((book) => normalizeIsbn(book.isbn)).filter(Boolean));
  const existingTitleKeys = new Set(
    existingBooks.map((book) => titleKey(book.title, book.authors)).filter((key) => key !== '|')
  );

  const seenIsbns = new Map();
  const seenTitleKeys = new Map();

  const validated = normalized.map((row) => {
    const errors = [];
    const warnings = [];

    if (!row.title) errors.push('Title is required');
    if (!row.authors.length) errors.push('At least one author is required');
    if (!Number.isFinite(row.copies) || row.copies < 1) errors.push('Copies must be a whole number of at least 1');
    else if (row.copies > 500) errors.push('Copies cannot exceed 500 per title in a single import');
    if (row.year !== null && (row.year < 1000 || row.year > 2100)) errors.push('Publication year must be between 1000 and 2100');

    if (row.isbn) {
      const result = isValidIsbn(row.isbn);
      if (!result.valid) errors.push(result.reason || 'Invalid ISBN');
    } else {
      warnings.push('No ISBN supplied');
    }
    if (!row.publisher) warnings.push('No publisher supplied');
    if (!row.department) warnings.push('No department supplied');

    const key = titleKey(row.title, row.authors);
    if (row.isbn) {
      if (seenIsbns.has(row.isbn)) errors.push(`Duplicate ISBN in file (row ${seenIsbns.get(row.isbn)})`);
      else seenIsbns.set(row.isbn, row.rowNumber);
      if (existingIsbns.has(row.isbn)) errors.push('A book with this ISBN already exists');
    }
    if (row.title && row.authors.length) {
      if (seenTitleKeys.has(key)) errors.push(`Duplicate title and author in file (row ${seenTitleKeys.get(key)})`);
      else seenTitleKeys.set(key, row.rowNumber);
      if (existingTitleKeys.has(key)) errors.push('A book with this title and primary author already exists');
    }

    let status = 'ready';
    if (errors.some((error) => error.includes('already exists') || error.includes('Duplicate'))) status = 'duplicate';
    if (errors.some((error) => !error.includes('already exists') && !error.includes('Duplicate'))) status = 'invalid';

    return { ...row, status, errors, warnings };
  });

  return { rows: validated };
};

const buildCopies = (row) => {
  const count = Math.max(1, Math.min(500, Math.floor(Number(row.copies) || 1)));
  return Array.from({ length: count }).map((_, index) => {
    const location = {};
    if (row.shelfLocation) {
      const parts = row.shelfLocation.split(',').map((part) => part.trim());
      location.floor = parts.find((part) => /floor/i.test(part)) || null;
      location.section = parts.find((part) => /section|pillar/i.test(part)) || null;
      location.shelf = row.shelfLocation;
    }
    return {
      code: null,
      accessionNumber: null,
      callNumber: row.callNumber || null,
      copyNumber: String(index + 1),
      status: 'available',
      location,
      locationString: row.shelfLocation || null,
      condition: 'good',
    };
  });
};

export const importBookRows = async (rows, actor, { mapping } = {}) => {
  const validation = await validateBookRows(rows, { mapping });
  if (validation.error) return validation;

  const results = [];
  let createdCount = 0;
  let failedCount = 0;

  for (const row of validation.rows) {
    if (row.status !== 'ready') {
      results.push(row);
      continue;
    }

    try {
      const book = await Book.create({
        title: row.title,
        authors: row.authors,
        isbn: row.isbn || null,
        publisher: row.publisher,
        placeOfPublication: row.placeOfPublication,
        year: row.year,
        category: row.category || 'General',
        department: row.department,
        subjects: row.subjects,
        notes: row.remarks ? [row.remarks] : [],
        copies: buildCopies(row),
        createdBy: actor?._id || null,
      });
      createdCount += 1;
      results.push({ ...row, status: 'created', bookId: String(book._id) });
    } catch (err) {
      failedCount += 1;
      results.push({
        ...row,
        status: 'failed',
        errors: [...row.errors, err.code === 11000 ? 'Duplicate record' : err.message || 'Could not import book'],
      });
    }
  }

  return {
    rows: results,
    summary: {
      total: results.length,
      created: createdCount,
      failed: failedCount,
      invalid: results.filter((row) => row.status === 'invalid').length,
      duplicate: results.filter((row) => row.status === 'duplicate').length,
      ready: results.filter((row) => row.status === 'ready').length,
    },
  };
};

export const previewBookImport = validateBookRows;

export default { validateBookRows, importBookRows, normalizeBookRow, BOOK_IMPORT_TEMPLATE_HEADERS };
