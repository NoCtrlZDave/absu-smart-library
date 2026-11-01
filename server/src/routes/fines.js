import express from 'express';
import Borrowing from '../models/Borrowing.js';
import FinePayment from '../models/FinePayment.js';
import { protect, authorize, requirePermission } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, badRequest, notFound } from '../utils/responses.js';
import logActivity from '../utils/audit.js';
import { computeBorrowingFine, getOutstandingForUser, recordFinePayment } from '../services/fines.js';
import { notifyUser } from '../services/circulation.js';
import { CIRCULATION_ROLES } from '../services/policies.js';
import { PERMISSIONS } from '../config/permissions.js';

const router = express.Router();

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  return { page, limit };
};

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const outstandingFor = (borrowing, computedAmount) => {
  if (borrowing.status === 'returned') {
    return Math.max(
      0,
      (borrowing.finesAccrued || 0) - (borrowing.finePaid || 0) - (borrowing.fineWaived || 0)
    );
  }
  return Math.max(0, (computedAmount || 0) - (borrowing.finePaid || 0));
};

router.get('/my', protect, asyncHandler(async (req, res) => {
  const summary = await getOutstandingForUser(req.user._id);
  const payments = await FinePayment.find({ user: req.user._id, status: 'completed' })
    .sort({ paidAt: -1 })
    .limit(50)
    .lean();
  return ok(res, {
    ...summary,
    payments: payments.map((payment) => ({ ...payment, id: payment._id.toString() })),
  });
}));

router.get('/summary', protect, authorize(...CIRCULATION_ROLES), asyncHandler(async (req, res) => {
  const [outstandingRows, payments] = await Promise.all([
    Borrowing.find({
      $or: [
        { status: 'active' },
        { status: 'returned', fineStatus: { $in: ['outstanding', 'partially_paid'] } },
      ],
    }).lean(),
    FinePayment.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
  ]);

  let outstandingTotal = 0;
  let overdueLoans = 0;
  for (const borrowing of outstandingRows) {
    const computed = await computeBorrowingFine(borrowing);
    const amount = outstandingFor(borrowing, computed.amount);
    if (amount > 0) outstandingTotal += amount;
    if (borrowing.status === 'active' && computed.days > 0) overdueLoans += 1;
  }

  return ok(res, {
    outstandingTotal: Math.round(outstandingTotal * 100) / 100,
    overdueLoans,
    collectedTotal: payments[0]?.total || 0,
    paymentCount: payments[0]?.count || 0,
  });
}));

router.get('/payments', protect, requirePermission(PERMISSIONS.FINES_VIEW), asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { search } = req.query;
  const filter = {};
  if (search) {
    const rx = new RegExp(escapeRegex(String(search)), 'i');
    filter.$or = [{ reference: rx }, { userName: rx }, { identifier: rx }];
  }
  const [items, total] = await Promise.all([
    FinePayment.find(filter).sort({ paidAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    FinePayment.countDocuments(filter),
  ]);
  return ok(res, {
    items: items.map((item) => ({ ...item, id: item._id.toString() })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

router.get('/', protect, requirePermission(PERMISSIONS.FINES_VIEW), asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const { search, status } = req.query;
  const filter = {};
  if (status === 'overdue') filter.dueDate = { $lt: new Date() };
  if (search) {
    const rx = new RegExp(escapeRegex(String(search)), 'i');
    filter.$or = [{ studentName: rx }, { matricNumber: rx }, { bookTitle: rx }];
  }
  const borrowings = await Borrowing.find(filter).sort({ dueDate: 1 }).lean();
  const enriched = [];
  for (const borrowing of borrowings) {
    const computed = await computeBorrowingFine(borrowing);
    const outstanding = outstandingFor(borrowing, computed.amount);
    if (status === 'outstanding' && outstanding <= 0) continue;
    if (outstanding <= 0 && borrowing.status === 'active' && !computed.days) continue;
    enriched.push({
      borrowingId: String(borrowing._id),
      studentName: borrowing.studentName,
      matricNumber: borrowing.matricNumber,
      bookTitle: borrowing.bookTitle,
      copyCode: borrowing.copyCode,
      status: borrowing.status,
      dueDate: borrowing.dueDate,
      returnedAt: borrowing.returnedAt,
      overdueDays: computed.days,
      rate: computed.rate,
      accrued: borrowing.status === 'returned' ? borrowing.finesAccrued || 0 : computed.amount,
      paid: borrowing.finePaid || 0,
      waived: borrowing.fineWaived || 0,
      outstanding,
      fineStatus: borrowing.fineStatus || (outstanding > 0 ? 'outstanding' : 'none'),
    });
  }
  const total = enriched.length;
  return ok(res, {
    items: enriched.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

router.post('/:borrowingId/pay', protect, requirePermission(PERMISSIONS.FINES_PAY), asyncHandler(async (req, res) => {
  const borrowing = await Borrowing.findById(req.params.borrowingId);
  if (!borrowing) return notFound(res, 'Borrowing record not found');

  if (borrowing.status === 'active') {
    const computed = await computeBorrowingFine(borrowing);
    if (computed.amount > 0) {
      borrowing.finesAccrued = computed.amount;
      borrowing.fineStatus = 'outstanding';
      await borrowing.save();
    }
  }

  const outstanding = outstandingFor(borrowing, 0);
  if (outstanding <= 0) return badRequest(res, 'This loan has no outstanding fine');

  const amount = req.body.amount !== undefined ? Number(req.body.amount) : outstanding;
  if (!Number.isFinite(amount) || amount <= 0) return badRequest(res, 'A valid payment amount is required');
  if (amount > outstanding) return badRequest(res, `Payment cannot exceed the outstanding amount of NGN ${outstanding}`);

  const result = await recordFinePayment({
    borrowing,
    amount,
    method: req.body.method,
    reference: req.body.reference,
    receivedBy: req.user,
    notes: req.body.notes,
  });

  await notifyUser({
    user: borrowing.student,
    title: 'Fine payment received',
    message: `A payment of NGN ${result.applied} was received. Reference: ${result.payment.reference}. Outstanding balance: NGN ${result.outstanding}.`,
    type: 'success',
    event: 'fine_paid',
    data: {
      amount: result.applied,
      reference: result.payment.reference,
      outstanding: result.outstanding,
      bookTitle: borrowing.bookTitle,
    },
    borrowing: borrowing._id,
    book: borrowing.book,
  });

  await logActivity({
    actor: req.user,
    action: 'FINE_PAYMENT_RECORDED',
    entity: 'Borrowing',
    entityId: borrowing._id,
    details: {
      amount: result.applied,
      reference: result.payment.reference,
      outstanding: result.outstanding,
      student: borrowing.matricNumber,
    },
  });

  return created(res, {
    payment: result.payment.toJSONSafe(),
    applied: result.applied,
    outstanding: result.outstanding,
  }, 'Fine payment recorded');
}));

router.post('/:borrowingId/waive', protect, requirePermission(PERMISSIONS.FINES_MANAGE), asyncHandler(async (req, res) => {
  const borrowing = await Borrowing.findById(req.params.borrowingId);
  if (!borrowing) return notFound(res, 'Borrowing record not found');
  const outstanding = outstandingFor(borrowing, 0);
  if (outstanding <= 0) return badRequest(res, 'This loan has no outstanding fine');

  const amount = req.body.amount !== undefined ? Number(req.body.amount) : outstanding;
  if (!Number.isFinite(amount) || amount <= 0 || amount > outstanding) {
    return badRequest(res, 'A valid waiver amount is required');
  }

  borrowing.fineWaived = (borrowing.fineWaived || 0) + amount;
  const remaining = Math.max(0, (borrowing.finesAccrued || 0) - (borrowing.finePaid || 0) - borrowing.fineWaived);
  borrowing.fineStatus = remaining <= 0 ? 'waived' : 'partially_paid';
  if (remaining <= 0) borrowing.fineSettledAt = new Date();
  await borrowing.save();

  await notifyUser({
    user: borrowing.student,
    title: 'Fine waived',
    message: `A fine of NGN ${amount} was waived on your account. Outstanding balance: NGN ${remaining}.`,
    type: 'info',
    event: 'fine_waived',
    data: { amount, outstanding: remaining, bookTitle: borrowing.bookTitle },
    borrowing: borrowing._id,
    book: borrowing.book,
  });

  await logActivity({
    actor: req.user,
    action: 'FINE_WAIVED',
    entity: 'Borrowing',
    entityId: borrowing._id,
    details: { amount, reason: req.body.reason || null, outstanding: remaining },
  });

  return ok(res, { waived: amount, outstanding: remaining }, 'Fine waived');
}));

router.get('/report', protect, requirePermission(PERMISSIONS.FINES_VIEW), asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const match = { status: 'completed' };
  if (from || to) {
    match.paidAt = {};
    if (from) match.paidAt.$gte = new Date(from);
    if (to) match.paidAt.$lte = new Date(to);
  }

  const [byMethod, byDay, totals] = await Promise.all([
    FinePayment.aggregate([
      { $match: match },
      { $group: { _id: '$method', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ]),
    FinePayment.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    FinePayment.aggregate([
      { $match: match },
      { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);

  return ok(res, {
    byMethod: byMethod.map((row) => ({ method: row._id, amount: row.amount, count: row.count })),
    byDay: byDay.map((row) => ({ date: row._id, amount: row.amount, count: row.count })),
    total: totals[0]?.amount || 0,
    count: totals[0]?.count || 0,
  });
}));

export default router;
