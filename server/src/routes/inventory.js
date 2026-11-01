import express from 'express';
import Book from '../models/Book.js';
import InventoryLog from '../models/InventoryLog.js';
import Reservation from '../models/Reservation.js';
import { protect, authorize, requirePermission } from '../middleware/auth.js';
import StockVerificationSession from '../models/StockVerificationSession.js';
import StockVerificationScan from '../models/StockVerificationScan.js';
import { CIRCULATION_ROLES } from '../services/policies.js';
import { PERMISSIONS } from '../config/permissions.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, badRequest, notFound } from '../utils/responses.js';
import logActivity from '../utils/audit.js';
import { expireStaleReservations, getInventoryForBooks } from '../services/circulation.js';

const router = express.Router();

router.get('/stats', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  await expireStaleReservations();
  const books = await Book.find().lean();
  const allCopies = books.flatMap((b) => b.copies || []);
  const countByStatus = (s) => allCopies.filter((c) => c.status === s).length;
  const reservationCounts = await Reservation.aggregate([
    { $match: { status: { $in: ['pending', 'approved'] } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const reservations = Object.fromEntries(reservationCounts.map((row) => [row._id, row.count]));

  return ok(res, {
    total_books: books.length,
    total_copies: allCopies.length,
    verified: countByStatus('available') + countByStatus('verified'),
    available: countByStatus('available') + countByStatus('verified'),
    reserved: countByStatus('reserved'),
    missing: countByStatus('missing'),
    misplaced: countByStatus('misplaced'),
    damaged: countByStatus('damaged'),
    borrowed: countByStatus('borrowed'),
    pending_reservations: reservations.pending || 0,
    approved_reservations: reservations.approved || 0,
    unavailable: allCopies.length - countByStatus('available') - countByStatus('verified') - countByStatus('reserved') - countByStatus('borrowed'),
  });
}));

router.get('/books', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  await expireStaleReservations();
  const { search, category, availability, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (category && category !== 'all') filter.category = category;
  if (search) {
    const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(escaped, 'i');
    filter.$or = [{ title: rx }, { authors: rx }, { isbn: rx }, { category: rx }, { locationString: rx }];
  }

  let rows = await getInventoryForBooks(filter);
  if (availability === 'available') rows = rows.filter((row) => row.availableCopies > 0);
  if (availability === 'unavailable') rows = rows.filter((row) => row.availableCopies === 0);

  const totals = rows.reduce(
    (acc, row) => ({
      totalCopies: acc.totalCopies + row.totalCopies,
      availableCopies: acc.availableCopies + row.availableCopies,
      reservedCopies: acc.reservedCopies + row.reservedCopies,
      borrowedCopies: acc.borrowedCopies + row.borrowedCopies,
      pendingReservations: acc.pendingReservations + row.pendingReservations,
    }),
    { totalCopies: 0, availableCopies: 0, reservedCopies: 0, borrowedCopies: 0, pendingReservations: 0 }
  );

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 50));
  const total = rows.length;
  rows = rows.slice((pageNumber - 1) * pageLimit, pageNumber * pageLimit);

  return ok(res, {
    items: rows,
    totals,
    pagination: { page: pageNumber, limit: pageLimit, total, totalPages: Math.ceil(total / pageLimit) },
  });
}));

router.get('/logs', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const { type, status, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;
  const logs = await InventoryLog.find(filter)
    .sort({ createdAt: -1 })
    .skip((Math.max(1, page) - 1) * limit)
    .limit(Number(limit))
    .lean();
  const total = await InventoryLog.countDocuments(filter);
  return ok(res, {
    items: logs.map((l) => ({ ...l, id: l._id.toString() })),
    pagination: { page: Number(page) || 1, limit: Number(limit), total },
  });
}));

router.post('/scan', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const { copyCode, detectedLocation, readerId, notes } = req.body;
  if (!copyCode) return badRequest(res, 'copyCode is required');

  const book = await Book.findOne({ 'copies.code': copyCode });
  if (!book) return badRequest(res, 'No book found for that copy code');

  const copy = book.copies.find((c) => c.code === copyCode);
  const expected = copy.locationString;
  const detected = detectedLocation || (readerId ? `${readerId} detected shelf` : null);
  const isMisplaced = expected && detected && !expected.toLowerCase().includes(detected.toLowerCase());

  if (isMisplaced) {
    copy.status = 'misplaced';
    copy.detectedLocation = detected;
  } else {
    copy.status = 'available';
    copy.detectedLocation = detected || null;
  }
  await book.save();

  const log = await InventoryLog.create({
    book: book._id,
    bookTitle: book.title,
    copyCode,
    type: isMisplaced ? 'misplaced' : 'verified',
    expectedLocation: expected,
    detectedLocation: detected,
    status: isMisplaced ? 'open' : 'resolved',
    readerId: readerId || null,
    notes: notes || null,
  });

  await logActivity({ actor: req.user, action: 'INVENTORY_SCAN', entity: 'InventoryLog', entityId: log._id });
  return created(res, { ...log.toObject(), id: log._id.toString() }, isMisplaced ? 'Misplaced book detected' : 'Book verified in place');
}));

router.get('/misplaced', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const logs = await InventoryLog.find({
    type: 'misplaced',
    status: 'open',
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const rows = await Promise.all(
    logs.map(async (l) => {
      const book = l.book ? await Book.findById(l.book).lean().catch(() => null) : null;
      let copy = null;
      if (book) {
        copy = (book.copies || []).find((c) => c.code === l.copyCode) || null;
      }
      return {
        id: l._id.toString(),
        book_title: l.bookTitle || book?.title || 'Unknown',
        copy_code: l.copyCode,
        expected_location: l.expectedLocation || (copy?.locationString ?? null),
        detected_location: l.detectedLocation,
        status: l.status,
        created_at: l.createdAt,
        reader_id: l.readerId,
      };
    })
  );
  return ok(res, rows);
}));

router.post('/misplaced/:id/resolve', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const log = await InventoryLog.findById(req.params.id);
  if (!log) return notFound(res, 'Log not found');

  log.status = 'resolved';
  log.resolvedBy = req.user._id;
  log.resolvedAt = new Date();
  await log.save();

  if (log.copyCode) {
    await Book.updateOne(
      { 'copies.code': log.copyCode },
      { $set: { 'copies.$.status': 'available', 'copies.$.detectedLocation': log.expectedLocation } }
    );
  }

  await logActivity({ actor: req.user, action: 'MISPLACED_RESOLVED', entity: 'InventoryLog', entityId: log._id });
  return ok(res, { ...log.toObject(), id: log._id.toString() }, 'Misplaced book resolved');
}));

router.get('/rfid', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const books = await Book.find().lean();
  const allCopies = books.flatMap((b) => b.copies || []);
  const recentEvents = await InventoryLog.find().sort({ createdAt: -1 }).limit(12).lean();
  const readerIds = await InventoryLog.distinct('readerId', { readerId: { $ne: null } });

  const readers = readerIds.filter(Boolean).map((id) => ({
    id,
    name: id,
    online: recentEvents.some((event) => event.readerId === id),
  }));

  return ok(res, {
    readers,
    readers_online: readers.filter((r) => r.online).length,
    books_detected: allCopies.filter((c) => c.detectedLocation || c.status === 'verified').length,
    misplaced_books: allCopies.filter((c) => c.status === 'misplaced').length,
    unknown_tags: 0,
    configured: readers.length > 0,
    note: readers.length
      ? 'Reader identifiers are derived from recorded inventory scans.'
      : 'No RFID/hardware readers have been integrated. Scans are recorded from barcode, QR or manual entry.',
    recent_events: recentEvents.map((e) => ({
      id: e._id.toString(),
      book: e.bookTitle,
      reader: e.readerId || 'Manual entry',
      location: e.detectedLocation || e.expectedLocation,
      status: e.type,
      time: e.createdAt,
    })),
  });
}));

// ----------------------- Stock Verification -----------------------

const copyIdentifier = (copy) => copy.code || copy.accessionNumber || String(copy._id);

const findBookAndCopy = async (rawCode) => {
  const code = String(rawCode || '').trim();
  if (!code) return null;

  let book = await Book.findOne({
    $or: [{ 'copies.accessionNumber': code }, { 'copies.code': code }],
  });
  if (book) {
    const copy = (book.copies || []).find(
      (item) => item.accessionNumber === code || item.code === code
    );
    if (copy) return { book, copy, matchType: 'copy' };
  }

  const isbn = code.replace(/[^0-9Xx]/g, '');
  if (isbn.length === 10 || isbn.length === 13) {
    book = await Book.findOne({ isbn });
    if (book) return { book, copy: null, matchType: 'isbn' };
  }

  return null;
};

router.get('/verifications', protect, requirePermission(PERMISSIONS.INVENTORY_VIEW), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total] = await Promise.all([
    StockVerificationSession.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageLimit)
      .limit(pageLimit)
      .lean(),
    StockVerificationSession.countDocuments(filter),
  ]);

  return ok(res, {
    items: items.map((item) => ({ ...item, id: item._id.toString() })),
    pagination: { page: pageNumber, limit: pageLimit, total, totalPages: Math.ceil(total / pageLimit) },
  });
}));

router.post('/verifications', protect, requirePermission(PERMISSIONS.INVENTORY_VERIFY), asyncHandler(async (req, res) => {
  const { name, department, category, location, notes } = req.body;
  if (!name) return badRequest(res, 'A session name is required');

  const bookFilter = {};
  if (department) bookFilter.department = department;
  if (category) bookFilter.category = category;

  const books = await Book.find(bookFilter).lean();
  const expectedCopyCodes = [];
  books.forEach((book) => {
    (book.copies || []).forEach((copy) => {
      if (location && copy.locationString && !copy.locationString.toLowerCase().includes(String(location).toLowerCase())) {
        return;
      }
      expectedCopyCodes.push(copyIdentifier(copy));
    });
  });

  if (!expectedCopyCodes.length) {
    return badRequest(res, 'No physical copies match the selected verification scope');
  }

  const session = await StockVerificationSession.create({
    name: String(name).trim(),
    scope: { department: department || null, category: category || null, location: location || null },
    expectedCount: expectedCopyCodes.length,
    expectedCopyCodes,
    startedBy: req.user._id,
    notes: notes || null,
  });

  await logActivity({
    actor: req.user,
    action: 'STOCK_VERIFICATION_STARTED',
    entity: 'StockVerificationSession',
    entityId: session._id,
    details: { name: session.name, expectedCount: expectedCopyCodes.length, scope: session.scope },
  });

  return created(res, session.toJSONSafe(), 'Stock verification session opened');
}));

router.get('/verifications/:id', protect, requirePermission(PERMISSIONS.INVENTORY_VIEW), asyncHandler(async (req, res) => {
  const session = await StockVerificationSession.findById(req.params.id).lean();
  if (!session) return notFound(res, 'Stock verification session not found');

  const scans = await StockVerificationScan.find({ session: session._id }).sort({ scannedAt: -1 }).lean();
  return ok(res, {
    session: { ...session, id: session._id.toString() },
    scans: scans.map((scan) => ({ ...scan, id: scan._id.toString() })),
  });
}));

router.post('/verifications/:id/scan', protect, requirePermission(PERMISSIONS.INVENTORY_VERIFY), asyncHandler(async (req, res) => {
  const session = await StockVerificationSession.findById(req.params.id);
  if (!session) return notFound(res, 'Stock verification session not found');
  if (!['open', 'in_progress'].includes(session.status)) {
    return badRequest(res, 'This verification session is no longer open for scanning');
  }

  const scannedCode = String(req.body.code || '').trim();
  if (!scannedCode) return badRequest(res, 'A barcode, QR code, accession number or ISBN is required');

  const match = await findBookAndCopy(scannedCode);
  const method = req.body.method || 'barcode';
  const detectedLocation = req.body.detectedLocation || null;

  let book = null;
  let copy = null;
  let result = 'unregistered';

  if (match) {
    book = match.book;
    copy = match.copy;

    if (match.matchType === 'isbn') {
      const alreadyScanned = new Set(
        (await StockVerificationScan.find({ session: session._id, book: book._id }).lean()).map(
          (scan) => scan.copyCode
        )
      );
      copy = (book.copies || []).find((item) => !alreadyScanned.has(copyIdentifier(item))) || null;
      if (!copy) {
        const scan = await StockVerificationScan.create({
          session: session._id,
          book: book._id,
          bookTitle: book.title,
          isbn: book.isbn,
          scannedCode,
          method: 'isbn',
          result: 'duplicate',
          scannedBy: req.user._id,
          notes: 'All copies for this ISBN have already been scanned in this session',
        });
        return ok(res, scan.toJSONSafe(), 'All copies for this ISBN were already scanned');
      }
    }

    if (copy) {
      const code = copyIdentifier(copy);
      const duplicate = await StockVerificationScan.findOne({
        session: session._id,
        copyCode: code,
        result: { $in: ['matched', 'misplaced', 'damaged'] },
      });
      if (duplicate) {
        const scan = await StockVerificationScan.create({
          session: session._id,
          book: book._id,
          bookTitle: book.title,
          copy: copy._id,
          copyCode: code,
          accessionNumber: copy.accessionNumber || null,
          isbn: book.isbn || null,
          scannedCode,
          method,
          result: 'duplicate',
          scannedBy: req.user._id,
          notes: 'This copy was already scanned in this session',
        });
        return ok(res, scan.toJSONSafe(), 'This copy has already been scanned in this session');
      }

      const expected = session.expectedCopyCodes.includes(code);
      const expectedLocation = copy.locationString || book.locationString || null;
      const misplaced =
        expected && detectedLocation && expectedLocation
          ? !expectedLocation.toLowerCase().includes(String(detectedLocation).toLowerCase())
          : false;

      if (!expected) result = 'unregistered';
      else if (copy.status === 'damaged') result = 'damaged';
      else if (misplaced) result = 'misplaced';
      else result = 'matched';

      if (result === 'misplaced') {
        copy.status = 'misplaced';
        copy.detectedLocation = detectedLocation;
        await book.save();
      } else if (result === 'matched' && copy.status === 'available') {
        copy.status = 'verified';
        copy.detectedLocation = detectedLocation || copy.detectedLocation || null;
        await book.save();
      }

      const scan = await StockVerificationScan.create({
        session: session._id,
        book: book._id,
        bookTitle: book.title,
        copy: copy._id,
        copyCode: code,
        accessionNumber: copy.accessionNumber || null,
        isbn: book.isbn || null,
        scannedCode,
        method,
        expectedLocation,
        detectedLocation,
        result,
        copyStatus: copy.status,
        scannedBy: req.user._id,
        notes: req.body.notes || null,
      });

      session.status = 'in_progress';
      session.scannedCount += 1;
      if (result === 'matched') session.matchedCount += 1;
      if (result === 'misplaced') session.misplacedCount += 1;
      if (result === 'damaged') session.damagedCount += 1;
      if (result === 'unregistered') session.unregisteredCount += 1;
      await session.save();

      await logActivity({
        actor: req.user,
        action: 'STOCK_VERIFICATION_SCAN',
        entity: 'StockVerificationSession',
        entityId: session._id,
        details: { code, result, book: book.title },
      });

      return created(res, scan.toJSONSafe(), `Scan recorded: ${result}`);
    }
  }

  const scan = await StockVerificationScan.create({
    session: session._id,
    scannedCode,
    method,
    result: 'unregistered',
    scannedBy: req.user._id,
    notes: req.body.notes || null,
  });

  session.status = 'in_progress';
  session.scannedCount += 1;
  session.unregisteredCount += 1;
  await session.save();

  return created(res, scan.toJSONSafe(), 'Unregistered item recorded');
}));

router.post('/verifications/:id/complete', protect, requirePermission(PERMISSIONS.INVENTORY_VERIFY), asyncHandler(async (req, res) => {
  const session = await StockVerificationSession.findById(req.params.id);
  if (!session) return notFound(res, 'Stock verification session not found');
  if (session.status === 'completed') return badRequest(res, 'This session is already completed');
  if (session.status === 'cancelled') return badRequest(res, 'This session was cancelled');

  const scans = await StockVerificationScan.find({ session: session._id }).lean();
  const scannedMatched = new Set(
    scans
      .filter((scan) => ['matched', 'misplaced', 'damaged'].includes(scan.result))
      .map((scan) => scan.copyCode)
  );
  const missingCodes = session.expectedCopyCodes.filter((code) => !scannedMatched.has(code));

  session.missingCount = missingCodes.length;
  session.status = 'completed';
  session.completedAt = new Date();
  session.completedBy = req.user._id;
  await session.save();

  for (const code of missingCodes) {
    const match = await findBookAndCopy(code).catch(() => null);
    await InventoryLog.create({
      book: match?.book?._id || null,
      bookTitle: match?.book?.title || null,
      copyCode: code,
      type: 'missing',
      expectedLocation: match?.copy?.locationString || null,
      status: 'open',
      notes: `Not found during stock verification session "${session.name}"`,
    }).catch(() => null);
  }

  await logActivity({
    actor: req.user,
    action: 'STOCK_VERIFICATION_COMPLETED',
    entity: 'StockVerificationSession',
    entityId: session._id,
    details: {
      expected: session.expectedCount,
      scanned: session.scannedCount,
      missing: session.missingCount,
    },
  });

  return ok(res, session.toJSONSafe(), 'Stock verification completed');
}));

router.post('/verifications/:id/cancel', protect, requirePermission(PERMISSIONS.INVENTORY_VERIFY), asyncHandler(async (req, res) => {
  const session = await StockVerificationSession.findById(req.params.id);
  if (!session) return notFound(res, 'Stock verification session not found');
  if (session.status === 'completed') return badRequest(res, 'Completed sessions cannot be cancelled');
  session.status = 'cancelled';
  session.completedAt = new Date();
  session.completedBy = req.user._id;
  session.notes = req.body.reason || session.notes;
  await session.save();
  await logActivity({
    actor: req.user,
    action: 'STOCK_VERIFICATION_CANCELLED',
    entity: 'StockVerificationSession',
    entityId: session._id,
  });
  return ok(res, session.toJSONSafe(), 'Stock verification session cancelled');
}));

router.get('/verifications/:id/report', protect, requirePermission(PERMISSIONS.INVENTORY_VIEW), asyncHandler(async (req, res) => {
  const session = await StockVerificationSession.findById(req.params.id).lean();
  if (!session) return notFound(res, 'Stock verification session not found');
  const scans = await StockVerificationScan.find({ session: session._id }).lean();

  const scannedMatched = new Set(
    scans.filter((scan) => ['matched', 'misplaced', 'damaged'].includes(scan.result)).map((scan) => scan.copyCode)
  );
  const missingCodes = session.expectedCopyCodes.filter((code) => !scannedMatched.has(code));

  const missingBooks = await Book.find({
    $or: [{ 'copies.accessionNumber': { $in: missingCodes } }, { 'copies.code': { $in: missingCodes } }],
  }).lean();
  const missing = [];
  missingBooks.forEach((book) => {
    (book.copies || []).forEach((copy) => {
      const code = copyIdentifier(copy);
      if (missingCodes.includes(code)) {
        missing.push({
          bookTitle: book.title,
          copyCode: code,
          accessionNumber: copy.accessionNumber,
          callNumber: copy.callNumber,
          expectedLocation: copy.locationString || book.locationString,
        });
      }
    });
  });

  return ok(res, {
    session: { ...session, id: session._id.toString() },
    summary: {
      expected: session.expectedCount,
      scanned: session.scannedCount,
      matched: scans.filter((scan) => scan.result === 'matched').length,
      missing: missingCodes.length,
      unregistered: scans.filter((scan) => scan.result === 'unregistered').length,
      misplaced: scans.filter((scan) => scan.result === 'misplaced').length,
      damaged: scans.filter((scan) => scan.result === 'damaged').length,
      duplicates: scans.filter((scan) => scan.result === 'duplicate').length,
    },
    missing,
    unregistered: scans
      .filter((scan) => scan.result === 'unregistered')
      .map((scan) => ({ scannedCode: scan.scannedCode, method: scan.method, scannedAt: scan.scannedAt })),
    misplaced: scans
      .filter((scan) => scan.result === 'misplaced')
      .map((scan) => ({
        bookTitle: scan.bookTitle,
        copyCode: scan.copyCode,
        expectedLocation: scan.expectedLocation,
        detectedLocation: scan.detectedLocation,
      })),
    damaged: scans
      .filter((scan) => scan.result === 'damaged')
      .map((scan) => ({ bookTitle: scan.bookTitle, copyCode: scan.copyCode })),
  });
}));

export default router;