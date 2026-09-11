import express from 'express';
import Book from '../models/Book.js';
import User from '../models/User.js';
import Borrowing from '../models/Borrowing.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/responses.js';

const router = express.Router();

router.use(protect, authorize('librarian', 'admin'));

router.get('/most-borrowed', asyncHandler(async (req, res) => {
  const agg = await Borrowing.aggregate([
    { $match: { status: { $in: ['active', 'overdue', 'returned'] } } },
    { $group: { _id: { book: '$book', copyCode: '$copyCode' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  const rows = await Promise.all(
    agg.map(async (a) => {
      const book = a._id.book ? await Book.findById(a._id.book).lean().catch(() => null) : null;
      return {
        title: book?.title || 'Unknown',
        isbn: book?.isbn || null,
        category: book?.category || null,
        copy_code: a._id.copyCode,
        times_borrowed: a.count,
      };
    })
  );
  return ok(res, rows);
}));

router.get('/most-active-students', asyncHandler(async (req, res) => {
  const agg = await Borrowing.aggregate([
    { $group: { _id: '$student', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  const rows = await Promise.all(
    agg.map(async (a) => {
      const s = a._id ? await User.findById(a._id).lean().catch(() => null) : null;
      return {
        name: s ? `${s.first_name} ${s.last_name}` : 'Unknown',
        matric_number: s?.matric_number || null,
        borrowed: a.count,
      };
    })
  );
  return ok(res, rows);
}));

router.get('/overdue', asyncHandler(async (req, res) => {
  const rows = await Borrowing.find({ status: 'overdue' }).sort({ dueDate: 1 }).limit(100);
  const items = await Promise.all(rows.map((b) => b.toFullJSON()));
  return ok(res, items.map((i) => ({
    ...i,
    days_overdue: Math.ceil((new Date() - new Date(i.due_date)) / 86400000),
  })));
}));

router.get('/by-category', asyncHandler(async (req, res) => {
  const agg = await Book.aggregate([
    { $group: { _id: '$category', books: { $sum: 1 } } },
    { $sort: { books: -1 } },
  ]);
  return ok(res, agg.map((a) => ({ category: a._id || 'General', books: a.books })));
}));

router.get('/monthly-borrowing', asyncHandler(async (req, res) => {
  const rows = await Borrowing.aggregate([
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 },
  ]);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return ok(res, rows.map((r) => ({
    month: `${months[r._id.month - 1]} ${r._id.year}`,
    count: r.count,
  })));
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

router.get('/summary', asyncHandler(async (req, res) => {
  const books = await Book.find().lean();
  const allCopies = books.flatMap((b) => b.copies || []);
  const countByStatus = (s) => allCopies.filter((c) => c.status === s).length;
  return ok(res, {
    total_books: books.length,
    total_copies: allCopies.length,
    available: countByStatus('available'),
    borrowed: countByStatus('borrowed'),
    missing: countByStatus('missing'),
    misplaced: countByStatus('misplaced'),
    damaged: countByStatus('damaged'),
  });
}));

export default router;