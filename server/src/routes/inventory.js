import express from 'express';
import Book from '../models/Book.js';
import InventoryLog from '../models/InventoryLog.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, badRequest, notFound } from '../utils/responses.js';
import logActivity from '../utils/audit.js';

const router = express.Router();

const SIMULATED_READERS = [
  { id: 'RFID-01', name: 'Main Gate', online: true },
  { id: 'RFID-02', name: 'CS Section', online: true },
  { id: 'RFID-03', name: 'Engineering', online: true },
  { id: 'RFID-04', name: 'Medicine', online: false },
  { id: 'RFID-05', name: 'Law', online: true },
  { id: 'RFID-06', name: 'Floor 1 Exit', online: true },
  { id: 'RFID-07', name: 'Agriculture', online: false },
  { id: 'RFID-08', name: 'Maths Section', online: true },
];

router.get('/stats', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
  const books = await Book.find().lean();
  const allCopies = books.flatMap((b) => b.copies || []);
  const countByStatus = (s) => allCopies.filter((c) => c.status === s).length;

  return ok(res, {
    total_books: books.length,
    total_copies: allCopies.length,
    verified: countByStatus('available') + countByStatus('verified'),
    available: countByStatus('available'),
    missing: countByStatus('missing'),
    misplaced: countByStatus('misplaced'),
    damaged: countByStatus('damaged'),
    borrowed: countByStatus('borrowed'),
  });
}));

router.get('/logs', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
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

router.post('/scan', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
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

router.get('/misplaced', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
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

router.post('/misplaced/:id/resolve', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
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

router.get('/rfid', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
  const books = await Book.find().lean();
  const allCopies = books.flatMap((b) => b.copies || []);
  const recentEvents = await InventoryLog.find().sort({ createdAt: -1 }).limit(12).lean();

  return ok(res, {
    readers: SIMULATED_READERS,
    readers_online: SIMULATED_READERS.filter((r) => r.online).length,
    books_detected: allCopies.filter((c) => c.detectedLocation || c.status === 'verified').length,
    misplaced_books: allCopies.filter((c) => c.status === 'misplaced').length,
    unknown_tags: 3,
    recent_events: recentEvents.map((e) => ({
      id: e._id.toString(),
      book: e.bookTitle,
      reader: e.readerId || 'RFID-SIM',
      location: e.detectedLocation || e.expectedLocation,
      status: e.type,
      time: e.createdAt,
    })),
  });
}));

export default router;