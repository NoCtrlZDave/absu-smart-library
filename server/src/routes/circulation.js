import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Book from '../models/Book.js';
import Borrowing from '../models/Borrowing.js';
import Reservation from '../models/Reservation.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, badRequest, notFound } from '../utils/responses.js';
import logActivity from '../utils/audit.js';

const router = express.Router();

const DEFAULT_LOAN_DAYS = 14;

const refreshOverdue = async () => {
  await Borrowing.updateMany(
    { status: 'active', dueDate: { $lt: new Date() } },
    { $set: { status: 'overdue' } }
  );
};

const findUser = async ({ studentId, email, matric_number }) => {
  if (studentId && mongoose.isValidObjectId(studentId)) return User.findById(studentId);
  if (email) return User.findOne({ email: email.toLowerCase() });
  if (matric_number) return User.findOne({ matric_number });
  return null;
};

// ----------------------- Borrowings -----------------------

router.get('/borrowings', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
  await refreshOverdue();
  const { status, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;

  let borrowings = await Borrowing.find(filter)
    .sort({ createdAt: -1 })
    .skip((Math.max(1, page) - 1) * limit)
    .limit(Number(limit));

  const rows = await Promise.all(borrowings.map((b) => b.toFullJSON()));

  if (search) {
    const s = String(search).toLowerCase();
    rows = rows.filter((r) =>
      (r.book_title || '').toLowerCase().includes(s) ||
      (r.student_name || '').toLowerCase().includes(s) ||
      (r.matric_number || '').toLowerCase().includes(s) ||
      (r.copy || '').toLowerCase().includes(s)
    );
  }

  const total = await Borrowing.countDocuments(filter);
  return ok(res, { items: rows, pagination: { page: Number(page) || 1, limit: Number(limit), total } });
}));

router.post('/borrowings', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
  const { student } = req.body;
  const { bookId, copyCode, dueDate, dueDays } = req.body;

  const studentUser = await findUser(student || req.body);
  if (!studentUser || studentUser.role !== 'student') return badRequest(res, 'Student not found');

  const book = await Book.findById(bookId);
  if (!book) return notFound(res, 'Book not found');

  const copy = (book.copies || []).find((c) => c.code === copyCode);
  if (!copy) return badRequest(res, 'Copy not found for this book');
  if (copy.status !== 'available') return badRequest(res, `Copy is not available for borrowing (${copy.status})`);

  const due = dueDate ? new Date(dueDate) : new Date(Date.now() + (Number(dueDays) || DEFAULT_LOAN_DAYS) * 86400000);

  copy.status = 'borrowed';
  copy.borrower = `${studentUser.first_name} ${studentUser.last_name}`;
  copy.dueDate = due.toISOString().slice(0, 10);
  await book.save();

  const borrowing = await Borrowing.create({
    student: studentUser._id,
    book: book._id,
    bookTitle: book.title,
    copyCode,
    borrowDate: new Date(),
    dueDate: due,
    issuedBy: req.user._id,
  });

  await logActivity({ actor: req.user, action: 'BORROWING_CREATED', entity: 'Borrowing', entityId: borrowing._id });
  return created(res, await borrowing.toFullJSON(), 'Book issued');
}));

router.post('/borrowings/:id/return', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
  const borrowing = await Borrowing.findById(req.params.id);
  if (!borrowing) return notFound(res, 'Borrowing not found');
  if (borrowing.status === 'returned') return badRequest(res, 'Borrowing already returned');

  borrowing.status = 'returned';
  borrowing.returnDate = new Date();
  if (borrowing.dueDate < new Date()) {
    borrowing.fine = Math.round((new Date() - borrowing.dueDate) / 86400000);
  }
  await borrowing.save();

  if (borrowing.copyCode) {
    await Book.updateOne(
      { _id: borrowing.book, 'copies.code': borrowing.copyCode },
      { $set: { 'copies.$.status': 'available', 'copies.$.borrower': null, 'copies.$.dueDate': null } }
    );
  }

  const pendingReservation = await Reservation.findOne({
    book: borrowing.book,
    status: 'pending',
  }).sort({ reserveDate: 1 });

  if (pendingReservation) {
    pendingReservation.status = 'available';
    await pendingReservation.save();
  }

  await logActivity({ actor: req.user, action: 'BOOK_RETURNED', entity: 'Borrowing', entityId: borrowing._id });
  return ok(res, await borrowing.toFullJSON(), 'Book returned');
}));

router.post('/borrowings/:id/renew', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
  const borrowing = await Borrowing.findById(req.params.id);
  if (!borrowing) return notFound(res, 'Borrowing not found');
  if (borrowing.status !== 'active') return badRequest(res, 'Only active borrowings can be renewed');
  if (borrowing.renewedCount >= 2) return badRequest(res, 'Maximum renewals reached');
  const days = Number(req.body.days) || DEFAULT_LOAN_DAYS;
  borrowing.dueDate = new Date(borrowing.dueDate.getTime() + days * 86400000);
  borrowing.renewedCount += 1;
  await borrowing.save();

  if (borrowing.copyCode) {
    await Book.updateOne(
      { _id: borrowing.book, 'copies.code': borrowing.copyCode },
      { $set: { 'copies.$.dueDate': borrowing.dueDate.toISOString().slice(0, 10) } }
    );
  }

  await logActivity({ actor: req.user, action: 'BORROWING_RENEWED', entity: 'Borrowing', entityId: borrowing._id });
  return ok(res, await borrowing.toFullJSON(), 'Borrowing renewed');
}));

router.get('/my/borrowings', protect, asyncHandler(async (req, res) => {
  await refreshOverdue();
  const rows = await Borrowing.find({
    student: req.user._id,
    status: { $in: ['active', 'overdue'] },
  }).sort({ dueDate: 1 });
  return ok(res, await Promise.all(rows.map((b) => b.toFullJSON())));
}));

router.get('/my/history', protect, asyncHandler(async (req, res) => {
  const rows = await Borrowing.find({
    student: req.user._id,
    status: 'returned',
  }).sort({ returnDate: -1 });
  return ok(res, await Promise.all(rows.map((b) => b.toFullJSON())));
}));

// ----------------------- Returns -----------------------

router.get('/returns', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
  await refreshOverdue();
  const { query, limit = 20 } = req.query;

  const filter = { status: { $in: ['active', 'overdue'] } };
  let rows = await Borrowing.find(filter).sort({ dueDate: 1 }).limit(Number(limit) * 3);

  let items = await Promise.all(rows.map((b) => b.toFullJSON()));
  if (query) {
    const q = String(query).toLowerCase();
    items = items.filter((r) =>
      (r.book_title || '').toLowerCase().includes(q) ||
      (r.student_name || '').toLowerCase().includes(q) ||
      (r.matric_number || '').toLowerCase().includes(q) ||
      (r.copy || '').toLowerCase().includes(q)
    );
  }

  return ok(res, {
    items: items.slice(0, Number(limit)),
    activeCount: items.length,
  });
}));

// ----------------------- Reservations -----------------------

router.get('/reservations', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  const rows = await Reservation.find(filter)
    .sort({ createdAt: -1 })
    .skip((Math.max(1, page) - 1) * limit)
    .limit(Number(limit));
  const total = await Reservation.countDocuments(filter);
  return ok(res, {
    items: await Promise.all(rows.map((r) => r.toFullJSON())),
    pagination: { page: Number(page) || 1, limit: Number(limit), total },
  });
}));

router.post('/reservations', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
  const { bookId } = req.body;
  const studentUser = await findUser(req.body.student || req.body);
  if (!studentUser || studentUser.role !== 'student') return badRequest(res, 'Student not found');

  const book = await Book.findById(bookId);
  if (!book) return notFound(res, 'Book not found');

  const existing = await Reservation.findOne({ student: studentUser._id, book: book._id, status: 'pending' });
  if (existing) return badRequest(res, 'Student already has an active reservation for this book');

  const availableCopy = (book.copies || []).find((c) => c.status === 'available');
  let reservation;
  if (availableCopy) {
    availableCopy.status = 'reserved';
    availableCopy.reservedBy = `${studentUser.first_name} ${studentUser.last_name}`;
    await book.save();
    reservation = await Reservation.create({
      student: studentUser._id,
      book: book._id,
      bookTitle: book.title,
      copyCode: availableCopy.code,
      status: 'available',
      expiresAt: new Date(Date.now() + 3 * 86400000),
    });
  } else {
    reservation = await Reservation.create({
      student: studentUser._id,
      book: book._id,
      bookTitle: book.title,
      status: 'pending',
    });
  }

  await logActivity({ actor: req.user, action: 'RESERVATION_CREATED', entity: 'Reservation', entityId: reservation._id });
  return created(res, await reservation.toFullJSON(), 'Reservation created');
}));

router.post('/reservations/:id/cancel', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return notFound(res, 'Reservation not found');
  if (reservation.status === 'cancelled') return badRequest(res, 'Already cancelled');
  reservation.status = 'cancelled';
  await reservation.save();

  if (reservation.copyCode) {
    await Book.updateOne(
      { _id: reservation.book, 'copies.code': reservation.copyCode, 'copies.status': 'reserved' },
      { $set: { 'copies.$.status': 'available', 'copies.$.reservedBy': null } }
    );
  }

  await logActivity({ actor: req.user, action: 'RESERVATION_CANCELLED', entity: 'Reservation', entityId: reservation._id });
  return ok(res, await reservation.toFullJSON(), 'Reservation cancelled');
}));

router.post('/reservations/:id/fulfill', protect, authorize('librarian', 'admin'), asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return notFound(res, 'Reservation not found');
  if (reservation.status === 'fulfilled') return badRequest(res, 'Already fulfilled');
  reservation.status = 'fulfilled';
  reservation.fulfilledDate = new Date();
  await reservation.save();
  await logActivity({ actor: req.user, action: 'RESERVATION_FULFILLED', entity: 'Reservation', entityId: reservation._id });
  return ok(res, await reservation.toFullJSON(), 'Reservation fulfilled');
}));

router.get('/my/reservations', protect, asyncHandler(async (req, res) => {
  const rows = await Reservation.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  return ok(res, await Promise.all(rows.map((r) => r.toFullJSON())));
}));

export default router;