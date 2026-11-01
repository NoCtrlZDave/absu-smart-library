import express from 'express';
import Book from '../models/Book.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Borrowing from '../models/Borrowing.js';
import Reservation from '../models/Reservation.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok } from '../utils/responses.js';
import { expireStaleReservations } from '../services/circulation.js';
import { CIRCULATION_ROLES } from '../services/policies.js';

const router = express.Router();

const startOfDay = (date = new Date()) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const buildDateFilter = (from, to) => {
  const range = {};
  if (from) range.$gte = new Date(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return Object.keys(range).length ? range : null;
};

router.get('/librarian', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  await expireStaleReservations();

  const { from, to, department, category, userCategory } = req.query;
  const bookFilter = {};
  if (department) bookFilter.department = department;
  if (category) bookFilter.category = category;

  const books = await Book.find(bookFilter).lean();
  const bookIds = books.map((book) => book._id);
  const allCopies = books.flatMap((b) => b.copies || []);
  const countCopies = (statuses) => allCopies.filter((c) => statuses.includes(c.status)).length;

  const borrowingFilter = {};
  if (books.length) borrowingFilter.book = { $in: bookIds };
  if (userCategory) borrowingFilter.patronCategory = userCategory;
  const dateRange = buildDateFilter(from, to);
  if (dateRange) borrowingFilter.borrowedAt = dateRange;

  const [
    pendingReservations,
    approvedReservations,
    activeLoans,
    overdueLoans,
    issuedToday,
    totalStudents,
    totalStaff,
    activeUsers,
    mostBorrowed,
    monthlyTrend,
    userCategoryBreakdown,
  ] = await Promise.all([
    Reservation.countDocuments({ status: 'pending' }),
    Reservation.countDocuments({ status: 'approved' }),
    Borrowing.countDocuments({ ...borrowingFilter, status: 'active' }),
    Borrowing.countDocuments({ ...borrowingFilter, status: 'active', dueDate: { $lt: new Date() } }),
    Borrowing.countDocuments({ borrowedAt: { $gte: startOfDay() } }),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'staff' }),
    User.countDocuments({ isActive: true, role: { $in: ['student', 'staff'] } }),
    Borrowing.aggregate([
      { $match: { ...borrowingFilter } },
      { $group: { _id: '$bookTitle', count: { $sum: 1 }, bookId: { $first: '$book' } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Borrowing.aggregate([
      { $match: { ...borrowingFilter, borrowedAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$borrowedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Borrowing.aggregate([
      { $match: borrowingFilter },
      { $group: { _id: '$patronCategory', count: { $sum: 1 } } },
    ]),
  ]);

  const counts = {
    total_books: books.length,
    total_copies: allCopies.length,
    available: countCopies(['available', 'verified']),
    reserved: countCopies(['reserved']),
    borrowed: countCopies(['borrowed']),
    missing: countCopies(['missing']),
    misplaced: countCopies(['misplaced']),
    damaged: countCopies(['damaged']),
    pending_reservations: pendingReservations,
    approved_reservations: approvedReservations,
    active_loans: activeLoans,
    overdue_loans: overdueLoans,
    issued_today: issuedToday,
    total_students: totalStudents,
    total_staff: totalStaff,
    active_users: activeUsers,
  };

  const categoryCounts = {};
  books.forEach((book) => {
    const key = book.category || 'General';
    categoryCounts[key] = (categoryCounts[key] || 0) + 1;
  });

  const latestBooks = books.slice(-6).reverse().map((b) => ({
    id: b._id.toString(),
    title: b.title,
    category: b.category,
    location: b.locationString,
    available: (b.copies || []).some((c) => c.status === 'available' || c.status === 'verified'),
    reserved: (b.copies || []).filter((c) => c.status === 'reserved').length,
    borrowed: (b.copies || []).filter((c) => c.status === 'borrowed').length,
    total_copies: (b.copies || []).length,
  }));

  return ok(res, {
    ...counts,
    latestBooks,
    charts: {
      monthlyBorrowings: monthlyTrend.map((row) => ({ month: row._id, count: row.count })),
      byCategory: Object.entries(categoryCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12),
      byUserCategory: userCategoryBreakdown.map((row) => ({ name: row._id || 'student', count: row.count })),
    },
    mostBorrowed: mostBorrowed.map((row) => ({
      title: row._id,
      count: row.count,
      bookId: row.bookId ? String(row.bookId) : null,
    })),
    applied: { from: from || null, to: to || null, department: department || null, category: category || null, userCategory: userCategory || null },
  });
}));

router.get('/admin', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const [students, staff, librarians, admins, books, logs, recentLogs] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'staff' }),
    User.countDocuments({ role: { $in: ['librarian', 'assistant_librarian', 'it_librarian', 'circulation_staff'] } }),
    User.countDocuments({ role: 'admin' }),
    Book.countDocuments(),
    AuditLog.countDocuments(),
    AuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  const totalCopies = await Book.aggregate([
    { $project: { n: { $size: { $ifNull: ['$copies', []] } } } },
    { $group: { _id: null, total: { $sum: '$n' } } },
  ]);

  return ok(res, {
    students,
    staff,
    librarians,
    admins,
    total_users: students + staff + librarians + admins,
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
