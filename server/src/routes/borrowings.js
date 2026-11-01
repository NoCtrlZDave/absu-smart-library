import express from 'express';
import Book from '../models/Book.js';
import Borrowing from '../models/Borrowing.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, badRequest, notFound } from '../utils/responses.js';
import logActivity from '../utils/audit.js';
import { collectReservation, issueBook, returnBorrowing, serializeBorrowing, getRenewalEligibility, renewBorrowingDirect, requestRenewal, approveRenewalRequest, rejectRenewalRequest } from '../services/borrowing.js';
import { CIRCULATION_ROLES } from '../services/policies.js';
import RenewalRequest from '../models/RenewalRequest.js';

const PATRON_ROLES = ['student', 'staff', 'guest'];

const router = express.Router();

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BORROWING_STATUSES = ['active', 'returned', 'lost'];

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit };
};

router.post('/', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const { studentId, matricNumber, bookId, copyId, copyCode, dueDate, notes, clientRequestId } = req.body;
  if (!studentId && !matricNumber) return badRequest(res, 'studentId or matricNumber is required');
  if (!bookId && !copyCode) return badRequest(res, 'bookId or copyCode is required');

  if (clientRequestId) {
    const existing = await Borrowing.findOne({ clientRequestId: String(clientRequestId).trim() });
    if (existing) {
      return ok(res, serializeBorrowing(existing), 'This issue request was already processed');
    }
  }

  const student = studentId
    ? await User.findById(studentId)
    : await User.findOne({ matricNumber: String(matricNumber).trim().toUpperCase() });
  if (!student) return notFound(res, 'Student not found');

  const book = bookId
    ? await Book.findById(bookId)
    : await Book.findOne({ 'copies.code': String(copyCode).trim() });
  if (!book) return notFound(res, 'Book not found');

  const borrowing = await issueBook({
    student,
    book,
    copyId,
    copyCode,
    dueDate,
    issuedBy: req.user,
    reservation: null,
  });

  if (clientRequestId) borrowing.clientRequestId = String(clientRequestId).trim();
  if (notes) borrowing.notes = String(notes).trim();
  if (clientRequestId || notes) await borrowing.save();

  await logActivity({
    actor: req.user,
    action: 'BOOK_ISSUED',
    entity: 'Borrowing',
    entityId: borrowing._id,
    details: { book: borrowing.bookTitle, student: borrowing.matricNumber, copy: borrowing.copyCode },
  });

  return created(res, serializeBorrowing(borrowing), 'Book issued');
}));

router.post('/reservations/:id/collect', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const borrowing = await collectReservation({
    reservationId: req.params.id,
    dueDate: req.body.dueDate,
    issuedBy: req.user,
  });

  await logActivity({
    actor: req.user,
    action: 'RESERVATION_COLLECTED',
    entity: 'Borrowing',
    entityId: borrowing._id,
    details: { book: borrowing.bookTitle, student: borrowing.matricNumber, copy: borrowing.copyCode },
  });

  return created(res, serializeBorrowing(borrowing), 'Reservation collected and book issued');
}));

router.get('/my', protect, authorize(...PATRON_ROLES), asyncHandler(async (req, res) => {
  const { status } = req.query;
  const { page, limit } = parsePagination(req.query);
  const filter = { student: req.user._id };
  if (status && BORROWING_STATUSES.includes(status)) filter.status = status;

  const [items, total, activeCount, overdueCount] = await Promise.all([
    Borrowing.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Borrowing.countDocuments(filter),
    Borrowing.countDocuments({ student: req.user._id, status: 'active' }),
    Borrowing.countDocuments({
      student: req.user._id,
      status: 'active',
      dueDate: { $lt: new Date() },
    }),
  ]);

  return ok(res, {
    items: items.map(serializeBorrowing),
    stats: { active: activeCount, overdue: overdueCount },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

router.get('/stats', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const [active, overdue, returned, lost] = await Promise.all([
    Borrowing.countDocuments({ status: 'active' }),
    Borrowing.countDocuments({ status: 'active', dueDate: { $lt: new Date() } }),
    Borrowing.countDocuments({ status: 'returned' }),
    Borrowing.countDocuments({ status: 'lost' }),
  ]);
  return ok(res, { active, overdue, returned, lost, total: active + returned + lost });
}));

router.get('/', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const { status, search, overdue } = req.query;
  const { page, limit } = parsePagination(req.query);
  const filter = {};
  if (status && status !== 'all' && BORROWING_STATUSES.includes(status)) filter.status = status;
  if (String(overdue) === 'true') {
    filter.status = 'active';
    filter.dueDate = { $lt: new Date() };
  }
  if (search) {
    const rx = new RegExp(escapeRegex(String(search)), 'i');
    filter.$or = [{ studentName: rx }, { matricNumber: rx }, { bookTitle: rx }, { copyCode: rx }];
  }

  const [items, total] = await Promise.all([
    Borrowing.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Borrowing.countDocuments(filter),
  ]);

  return ok(res, {
    items: items.map(serializeBorrowing),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

router.patch('/:id/return', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const existing = await Borrowing.findById(req.params.id);
  if (!existing) return notFound(res, 'Borrowing record not found');
  if (existing.status === 'returned') {
    return ok(res, serializeBorrowing(existing), 'This book was already returned');
  }

  const borrowing = await returnBorrowing({
    borrowingId: req.params.id,
    returnedBy: req.user,
    condition: req.body.condition,
    notes: req.body.notes,
  });

  await logActivity({
    actor: req.user,
    action: 'BOOK_RETURNED',
    entity: 'Borrowing',
    entityId: borrowing._id,
    details: { book: borrowing.bookTitle, student: borrowing.matricNumber, condition: borrowing.returnCondition },
  });

  return ok(res, serializeBorrowing(borrowing), 'Book returned');
}));

router.get('/renewals', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const { page, limit } = parsePagination(req.query);
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(String(search)), 'i');
    filter.$or = [{ userName: rx }, { identifier: rx }, { bookTitle: rx }];
  }

  const [items, total] = await Promise.all([
    RenewalRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    RenewalRequest.countDocuments(filter),
  ]);

  return ok(res, {
    items: items.map((item) => ({ ...item, id: item._id.toString() })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

router.get('/:id/renewal-eligibility', protect, asyncHandler(async (req, res) => {
  const borrowing = await Borrowing.findById(req.params.id);
  if (!borrowing) return notFound(res, 'Borrowing record not found');
  const isOwner = String(borrowing.student) === String(req.user._id);
  if (!isOwner && !CIRCULATION_ROLES.includes(req.user.role)) {
    return notFound(res, 'Borrowing record not found');
  }
  const eligibility = await getRenewalEligibility(borrowing);
  return ok(res, eligibility);
}));

router.post('/:id/renew-request', protect, authorize(...PATRON_ROLES), asyncHandler(async (req, res) => {
  const request = await requestRenewal({
    borrowingId: req.params.id,
    user: req.user,
    reason: req.body.reason,
  });
  return created(res, request.toJSONSafe(), 'Renewal request submitted');
}));

router.post('/:id/renew', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const borrowing = await renewBorrowingDirect({
    borrowingId: req.params.id,
    renewedBy: req.user,
    notes: req.body.notes,
  });
  return ok(res, serializeBorrowing(borrowing), 'Loan renewed');
}));

router.patch('/renewals/:id/approve', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const result = await approveRenewalRequest({ requestId: req.params.id, processedBy: req.user });
  return ok(res, {
    request: result.request.toJSONSafe(),
    borrowing: serializeBorrowing(result.borrowing),
  }, 'Renewal approved');
}));

router.patch('/renewals/:id/reject', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const request = await rejectRenewalRequest({
    requestId: req.params.id,
    processedBy: req.user,
    reason: req.body.reason,
  });
  return ok(res, request.toJSONSafe(), 'Renewal rejected');
}));

export default router;
