import express from 'express';
import Book from '../models/Book.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/responses.js';

const router = express.Router();

router.get('/librarian', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
  const books = await Book.find().lean();
  const allCopies = books.flatMap((b) => b.copies || []);
  const counts = {
    total_books: books.length,
    total_copies: allCopies.length,
    available: allCopies.filter((c) => c.status === 'available').length,
    missing: allCopies.filter((c) => c.status === 'missing').length,
    misplaced: allCopies.filter((c) => c.status === 'misplaced').length,
    damaged: allCopies.filter((c) => c.status === 'damaged').length,
  };

  const latestBooks = books.slice(-6).reverse().map((b) => ({
    id: b._id.toString(),
    title: b.title,
    category: b.category,
    location: b.locationString,
    available: (b.copies || []).some((c) => c.status === 'available'),
    total_copies: (b.copies || []).length,
  }));

  return ok(res, { ...counts, latestBooks });
}));

router.get('/admin', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const [librarians, admins, books, logs, recentLogs] = await Promise.all([
    User.countDocuments({ role: 'librarian' }),
    User.countDocuments({ role: 'admin' }),
    Book.countDocuments(),
    AuditLog.countDocuments(),
    AuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const totalCopies = await Book.aggregate([{ $project: { n: { $size: { $ifNull: ['$copies', []] } } } }, { $group: { _id: null, total: { $sum: '$n' } } }]);

  return ok(res, {
    librarians,
    admins,
    total_users: librarians + admins,
    total_books: books,
    total_copies: totalCopies[0]?.total || 0,
    total_logs: logs,
    recentLogs: recentLogs.map((l) => ({
      id: l._id.toString(),
      action: l.action,
      actor_name: l.actorName || 'System',
      entity: l.entity,
      created_at: l.createdAt,
    })),
  });
}));

export default router;