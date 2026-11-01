import express from 'express';
import Book from '../models/Book.js';
import Borrowing from '../models/Borrowing.js';
import Reservation from '../models/Reservation.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, badRequest, notFound } from '../utils/responses.js';
import logActivity from '../utils/audit.js';
import {
  getCollectionDeadline,
  getMaxActiveBorrowings,
  isCopyAvailable,
  notifyUser,
  releaseReservedCopy,
  expireStaleReservations,
} from '../services/circulation.js';
import { CIRCULATION_ROLES, getPolicy, resolvePatronCategory } from '../services/policies.js';

const PATRON_ROLES = ['student', 'staff', 'guest'];

const router = express.Router();

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const RESERVATION_STATUSES = ['pending', 'approved', 'rejected', 'cancelled', 'expired', 'fulfilled'];

const studentLabel = (user) =>
  `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.matricNumber || 'Student';

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit };
};

const reservationResponse = (reservation) => {
  const obj = reservation.toJSONSafe();
  obj.isExpired = obj.status === 'approved' && obj.expiresAt && new Date(obj.expiresAt) <= new Date();
  return obj;
};

router.post('/', protect, authorize(...PATRON_ROLES), asyncHandler(async (req, res) => {
  const { bookId, notes } = req.body;
  if (!bookId) return badRequest(res, 'bookId is required');

  const book = await Book.findById(bookId);
  if (!book) return notFound(res, 'Book not found');
  if (!book.copies || !book.copies.length) return badRequest(res, 'This title has no physical copies to reserve');

  const [existingReservation, activeBorrowing] = await Promise.all([
    Reservation.findOne({
      student: req.user._id,
      book: book._id,
      status: { $in: ['pending', 'approved'] },
    }),
    Borrowing.findOne({ student: req.user._id, book: book._id, status: 'active' }),
  ]);

  if (activeBorrowing) return badRequest(res, 'You already have this book on loan');
  if (existingReservation) return badRequest(res, 'You already have an active reservation for this book');

  const category = resolvePatronCategory(req.user.role);
  const limit = await getPolicy(`reservation.${category === 'staff' ? 'staff' : category}Limit`);
  if (limit <= 0) return badRequest(res, 'Reservations are not available for your user category');
  const activeCount = await Reservation.countDocuments({
    student: req.user._id,
    status: { $in: ['pending', 'approved'] },
  });
  if (activeCount >= limit) {
    return badRequest(res, `You have reached the maximum of ${limit} active reservations`);
  }

  const reservation = await Reservation.create({
    student: req.user._id,
    studentName: studentLabel(req.user),
    matricNumber: req.user.matricNumber || req.user.staffId || null,
    department: req.user.department || null,
    book: book._id,
    bookTitle: book.title,
    bookAuthor: (book.authors || []).join(', ') || null,
    notes: notes || null,
  });

  await notifyUser({
    user: req.user._id,
    title: 'Reservation request received',
    message: `Your reservation request for "${book.title}" has been received and is awaiting approval.`,
    type: 'info',
    event: 'reservation_requested',
    data: { bookTitle: book.title },
    reservation: reservation._id,
    book: book._id,
  });

  await logActivity({
    actor: req.user,
    action: 'RESERVATION_REQUESTED',
    entity: 'Reservation',
    entityId: reservation._id,
    details: { book: book.title },
  });

  return created(res, reservationResponse(reservation), 'Reservation request submitted');
}));

router.get('/my', protect, authorize(...PATRON_ROLES), asyncHandler(async (req, res) => {
  await expireStaleReservations();
  const { status } = req.query;
  const { page: pageNumber, limit: pageLimit } = parsePagination(req.query);
  const filter = { student: req.user._id };
  if (status && RESERVATION_STATUSES.includes(status)) filter.status = status;

  const [items, total, statusCounts] = await Promise.all([
    Reservation.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageLimit)
      .limit(pageLimit),
    Reservation.countDocuments(filter),
    Reservation.aggregate([
      { $match: { student: req.user._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  return ok(res, {
    items: items.map(reservationResponse),
    statusCounts: Object.fromEntries(statusCounts.map((item) => [item._id, item.count])),
    pagination: { page: pageNumber, limit: pageLimit, total, totalPages: Math.ceil(total / pageLimit) },
  });
}));

router.get('/stats', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  await expireStaleReservations();
  const rows = await Reservation.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  const counts = Object.fromEntries(RESERVATION_STATUSES.map((status) => [status, 0]));
  rows.forEach((row) => {
    counts[row._id] = row.count;
  });
  return ok(res, counts);
}));

router.get('/', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  await expireStaleReservations();
  const { status, search } = req.query;
  const { page, limit } = parsePagination(req.query);
  const filter = {};
  if (status && status !== 'all' && RESERVATION_STATUSES.includes(status)) filter.status = status;
  if (search) {
    const rx = new RegExp(escapeRegex(String(search)), 'i');
    filter.$or = [
      { studentName: rx },
      { matricNumber: rx },
      { bookTitle: rx },
      { bookAuthor: rx },
      { copyCode: rx },
    ];
  }

  const [items, total, statusRows] = await Promise.all([
    Reservation.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Reservation.countDocuments(filter),
    Reservation.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const statusCounts = Object.fromEntries(RESERVATION_STATUSES.map((statusKey) => [statusKey, 0]));
  statusRows.forEach((row) => {
    statusCounts[row._id] = row.count;
  });

  return ok(res, {
    items: items.map(reservationResponse),
    statusCounts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

router.get('/:id', protect, asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return notFound(res, 'Reservation not found');

  const isOwner = String(reservation.student) === String(req.user._id);
  const isStaff = CIRCULATION_ROLES.includes(req.user.role);
  if (!isOwner && !isStaff) return notFound(res, 'Reservation not found');

  return ok(res, reservationResponse(reservation));
}));

router.patch('/:id/approve', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  await expireStaleReservations();

  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return notFound(res, 'Reservation not found');
  if (reservation.status !== 'pending') return badRequest(res, 'Only pending reservations can be approved');

  const [book, duplicateLoan, activeCount, maxActive] = await Promise.all([
    Book.findById(reservation.book),
    Borrowing.findOne({ student: reservation.student, book: reservation.book, status: 'active' }),
    Borrowing.countDocuments({ student: reservation.student, status: 'active' }),
    getMaxActiveBorrowings(),
  ]);

  if (!book) return notFound(res, 'Book not found');
  if (duplicateLoan) return badRequest(res, 'This student already has an active loan for this book');
  if (maxActive > 0 && activeCount >= maxActive) {
    return badRequest(res, `This student has reached the maximum of ${maxActive} active loans`);
  }

  const deadline = await getCollectionDeadline();
  let allocated = null;

  for (let attempt = 0; attempt < 3 && !allocated; attempt += 1) {
    const freshBook = await Book.findById(reservation.book);
    const candidate = (freshBook?.copies || []).find((copy) => isCopyAvailable(copy.status));
    if (!candidate) break;

    const updatedBook = await Book.findOneAndUpdate(
      {
        _id: freshBook._id,
        copies: {
          $elemMatch: {
            _id: candidate._id,
            status: candidate.status,
          },
        },
      },
      {
        $set: {
          'copies.$.status': 'reserved',
          'copies.$.reservedBy': `${reservation.studentName} (${reservation.matricNumber})`,
          'copies.$.reservedUntil': deadline,
        },
      },
      { new: true }
    );

    if (updatedBook) {
      allocated = updatedBook.copies.id(candidate._id);
    }
  }

  if (!allocated) {
    return badRequest(res, 'No available physical copy could be allocated for this title');
  }

  const won = await Reservation.findOneAndUpdate(
    { _id: reservation._id, status: 'pending' },
    {
      $set: {
        status: 'approved',
        copy: allocated._id,
        copyCode: allocated.code,
        expiresAt: deadline,
        processedBy: req.user._id,
        processedAt: new Date(),
        rejectionReason: null,
      },
    },
    { new: true }
  );

  if (!won) {
    await Book.updateOne(
      { _id: reservation.book, copies: { $elemMatch: { _id: allocated._id, status: 'reserved' } } },
      {
        $set: {
          'copies.$.status': 'available',
          'copies.$.reservedBy': null,
          'copies.$.reservedUntil': null,
        },
      }
    );
    return badRequest(res, 'This reservation was already processed. Please refresh and try again.');
  }

  await notifyUser({
    user: won.student,
    title: 'Reservation approved',
    message: `Your reservation for "${won.bookTitle}" was approved. Collect it by ${
      deadline ? deadline.toLocaleDateString() : 'the collection desk'
    }. Copy: ${won.copyCode || 'assigned at the desk'}.`,
    type: 'success',
    event: 'reservation_approved',
    data: {
      bookTitle: won.bookTitle,
      deadline: deadline ? deadline.toLocaleDateString() : '',
      copyCode: won.copyCode || '',
    },
    reservation: won._id,
    book: won.book,
  });

  await logActivity({
    actor: req.user,
    action: 'RESERVATION_APPROVED',
    entity: 'Reservation',
    entityId: won._id,
    details: { copyCode: won.copyCode, book: won.bookTitle },
  });

  return ok(res, reservationResponse(won), 'Reservation approved and copy reserved');
}));

router.patch('/:id/reject', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const reason = req.body.reason ? String(req.body.reason).trim() : null;
  const won = await Reservation.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    {
      $set: {
        status: 'rejected',
        rejectionReason: reason,
        processedBy: req.user._id,
        processedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!won) {
    const existing = await Reservation.findById(req.params.id);
    if (!existing) return notFound(res, 'Reservation not found');
    return badRequest(res, 'Only pending reservations can be rejected');
  }

  await notifyUser({
    user: won.student,
    title: 'Reservation rejected',
    message: `Your reservation for "${won.bookTitle}" was rejected${reason ? `: ${reason}` : '.'}`,
    type: 'warning',
    event: 'reservation_rejected',
    data: { bookTitle: won.bookTitle, reason: reason || '' },
    reservation: won._id,
    book: won.book,
  });

  await logActivity({
    actor: req.user,
    action: 'RESERVATION_REJECTED',
    entity: 'Reservation',
    entityId: won._id,
    details: { reason },
  });

  return ok(res, reservationResponse(won), 'Reservation rejected');
}));

router.patch('/:id/cancel', protect, asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) return notFound(res, 'Reservation not found');

  const isOwner = String(reservation.student) === String(req.user._id);
  const isStaff = CIRCULATION_ROLES.includes(req.user.role);
  if (!isOwner && !isStaff) return notFound(res, 'Reservation not found');
  if (!['pending', 'approved'].includes(reservation.status)) {
    return badRequest(res, 'Only pending or approved reservations can be cancelled');
  }

  const reason = req.body.reason ? String(req.body.reason).trim() : null;
  const won = await Reservation.findOneAndUpdate(
    { _id: reservation._id, status: reservation.status },
    {
      $set: {
        status: 'cancelled',
        cancelledBy: req.user._id,
        cancelledAt: new Date(),
        cancelReason: reason,
      },
    },
    { new: true }
  );
  if (!won) return badRequest(res, 'This reservation was already processed. Please refresh and try again.');

  if (won.copy) await releaseReservedCopy(won);

  await notifyUser({
    user: won.student,
    title: 'Reservation cancelled',
    message: `Your reservation for "${won.bookTitle}" was cancelled${reason ? `: ${reason}` : '.'}`,
    type: 'info',
    reservation: won._id,
    book: won.book,
  });

  await logActivity({
    actor: req.user,
    action: 'RESERVATION_CANCELLED',
    entity: 'Reservation',
    entityId: won._id,
    details: { reason },
  });

  return ok(res, reservationResponse(won), 'Reservation cancelled');
}));

export default router;
