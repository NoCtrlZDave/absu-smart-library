import express from 'express';
import Book from '../models/Book.js';
import User from '../models/User.js';
import Borrowing from '../models/Borrowing.js';
import Reservation from '../models/Reservation.js';
import AuditLog from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/responses.js';

const router = express.Router();

const refreshOverdue = async () => {
  await Borrowing.updateMany(
    { status: 'active', dueDate: { $lt: new Date() } },
    { $set: { status: 'overdue' } }
  );
};

const borrowingsForUser = async (userId) => {
  await refreshOverdue();
  return Borrowing.find({ student: userId, status: { $in: ['active', 'overdue'] } });
};

router.get('/student', protect, asyncHandler(async (req, res) => {
  await refreshOverdue();
  const [active, overdue, reservations, history] = await Promise.all([
    Borrowing.countDocuments({ student: req.user._id, status: 'active' }),
    Borrowing.countDocuments({ student: req.user._id, status: 'overdue' }),
    Reservation.countDocuments({ student: req.user._id, status: { $in: ['pending', 'available'] } }),
    Borrowing.countDocuments({ student: req.user._id, status: 'returned' }),
  ]);

  const borrowed = await borrowingsForUser(req.user._id);
  const recentBorrowings = await Promise.all(borrowed.slice(0, 5).map((b) => b.toFullJSON()));

  return ok(res, {
    currently_borrowed: active,
    overdue,
    overdue_total: overdue + active,
    reservations,
    books_read: history,
    recentBorrowings,
  });
}));

router.get('/librarian', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
  await refreshOverdue();
  const books = await Book.find().lean();
  const allCopies = books.flatMap((b) => b.copies || []);
  const counts = {
    total_books: books.length,
    total_copies: allCopies.length,
    available: allCopies.filter((c) => c.status === 'available').length,
    borrowed: allCopies.filter((c) => c.status === 'borrowed').length,
    reserved: allCopies.filter((c) => c.status === 'reserved').length,
    missing: allCopies.filter((c) => c.status === 'missing').length,
    damaged: allCopies.filter((c) => c.status === 'damaged').length,
    misplaced: allCopies.filter((c) => c.status === 'misplaced').length,
  };

  const [overdue, reservations, activeBorrowings] = await Promise.all([
    Borrowing.countDocuments({ status: 'overdue' }),
    Reservation.countDocuments({ status: 'pending' }),
    Borrowing.countDocuments({ status: 'active' }),
  ]);

  const recentBorrowings = await Promise.all(
    (await Borrowing.find().sort({ createdAt: -1 }).limit(6)).map((b) => b.toFullJSON())
  );
  const recentReservations = await Promise.all(
    (await Reservation.find().sort({ createdAt: -1 }).limit(6)).map((r) => r.toFullJSON())
  );
  const latestBooks = books.slice(-5).reverse().map((b) => ({
    id: b._id.toString(),
    title: b.title,
    category: b.category,
    available: (b.copies || []).some((c) => c.status === 'available'),
  }));

  return ok(res, {
    ...counts,
    overdue,
    reservations,
    active_borrowings: activeBorrowings,
    recentBorrowings,
    recentReservations,
    latestBooks,
  });
}));

router.get('/admin', protect, authorize('admin'), asyncHandler(async (req, res) => {
  await refreshOverdue();
  const [students, librarians, admins, books, activeBorrowings, overdue, logs, recentLogs] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'librarian' }),
    User.countDocuments({ role: 'admin' }),
    Book.countDocuments(),
    Borrowing.countDocuments({ status: 'active' }),
    Borrowing.countDocuments({ status: 'overdue' }),
    AuditLog.countDocuments(),
    AuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const totalCopies = await Book.aggregate([{ $project: { n: { $size: { $ifNull: ['$copies', []] } } } }, { $group: { _id: null, total: { $sum: '$n' } } }]);

  return ok(res, {
    students,
    librarians,
    admins,
    total_users: students + librarians + admins,
    total_books: books,
    total_copies: totalCopies[0]?.total || 0,
    active_borrowings: activeBorrowings,
    overdue,
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