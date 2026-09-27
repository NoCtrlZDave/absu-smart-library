import express from 'express';
import Book from '../models/Book.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/responses.js';

const router = express.Router();

router.use(protect, authorize('librarian', 'admin'));

router.get('/by-category', asyncHandler(async (req, res) => {
  const agg = await Book.aggregate([
    { $group: { _id: '$category', books: { $sum: 1 } } },
    { $sort: { books: -1 } },
  ]);
  return ok(res, agg.map((a) => ({ category: a._id || 'General', books: a.books })));
}));

router.get('/missing', asyncHandler(async (req, res) => {
  const books = await Book.find({ 'copies.status': 'missing' }).lean();
  const items = [];
  books.forEach((b) => {
    b.copies.filter((c) => c.status === 'missing').forEach((c) => {
      items.push({ book: b.title, copy: c.code, location: c.locationString });
    });
  });
  return ok(res, items);
}));

router.get('/by-location', asyncHandler(async (req, res) => {
  const books = await Book.find().lean();
  const bySection = {};
  books.forEach((b) => {
    (b.copies || []).forEach((c) => {
      const loc = c.locationString || b.locationString || 'Unknown location';
      bySection[loc] = (bySection[loc] || 0) + 1;
    });
  });
  return ok(res, Object.entries(bySection)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count));
}));

router.get('/summary', asyncHandler(async (req, res) => {
  const books = await Book.find().lean();
  const allCopies = books.flatMap((b) => b.copies || []);
  const countByStatus = (s) => allCopies.filter((c) => c.status === s).length;
  return ok(res, {
    total_books: books.length,
    total_copies: allCopies.length,
    available: countByStatus('available'),
    missing: countByStatus('missing'),
    misplaced: countByStatus('misplaced'),
    damaged: countByStatus('damaged'),
  });
}));

export default router;