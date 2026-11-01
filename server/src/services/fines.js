import Borrowing from '../models/Borrowing.js';
import FinePayment from '../models/FinePayment.js';
import { getPolicy, getRolePolicy, resolvePatronCategory } from './policies.js';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const getFinePolicy = async (role = 'student') => {
  const [enabled, dailyRate, gracePeriodDays, maxFine, rolePolicy] = await Promise.all([
    getPolicy('fines.enabled'),
    getPolicy('fines.dailyRate'),
    getPolicy('fines.gracePeriodDays'),
    getPolicy('fines.maxFine'),
    getRolePolicy(role),
  ]);

  return {
    enabled,
    dailyRate,
    rate: rolePolicy?.fineRate ?? dailyRate,
    gracePeriodDays,
    maxFine,
    category: resolvePatronCategory(role),
  };
};

export const calculateFineAmount = ({
  dueDate,
  asOf = new Date(),
  rate = 0,
  gracePeriodDays = 0,
  maxFine = 0,
  enabled = true,
}) => {
  if (!enabled || !dueDate) return { days: 0, amount: 0, rate: Number(rate) || 0 };
  const due = new Date(dueDate);
  const now = new Date(asOf);
  if (Number.isNaN(due.getTime()) || Number.isNaN(now.getTime())) {
    return { days: 0, amount: 0, rate: Number(rate) || 0 };
  }

  const graceMs = Math.max(0, Number(gracePeriodDays) || 0) * MS_PER_DAY;
  const overdueMs = now.getTime() - due.getTime() - graceMs;
  if (overdueMs <= 0) return { days: 0, amount: 0, rate: Number(rate) || 0 };

  const days = Math.ceil(overdueMs / MS_PER_DAY);
  let amount = days * (Number(rate) || 0);
  if (Number(maxFine) > 0) amount = Math.min(amount, Number(maxFine));

  return { days, amount: Math.round(amount * 100) / 100, rate: Number(rate) || 0 };
};

export const computeBorrowingFine = async (borrowing, asOf = new Date()) => {
  const policy = await getFinePolicy(borrowing.patronCategory || borrowing.role || 'student');
  const rate = borrowing.fineRate || policy.rate;
  const grace = borrowing.fineGraceDays ?? policy.gracePeriodDays;
  const cap = borrowing.fineCap || policy.maxFine;
  const result = calculateFineAmount({
    dueDate: borrowing.dueDate,
    asOf,
    rate,
    gracePeriodDays: grace,
    maxFine: cap,
    enabled: policy.enabled,
  });
  return { ...result, policy };
};

export const getOutstandingForUser = async (userId) => {
  const borrowings = await Borrowing.find({
    student: userId,
    $or: [
      { status: 'active' },
      { status: 'returned', fineStatus: { $in: ['outstanding', 'partially_paid'] } },
    ],
  }).lean();

  const items = [];
  let total = 0;
  for (const borrowing of borrowings) {
    let amount = 0;
    if (borrowing.status === 'active') {
      const computed = await computeBorrowingFine(borrowing);
      amount = Math.max(0, computed.amount - (borrowing.finePaid || 0));
    } else {
      amount = Math.max(0, (borrowing.finesAccrued || 0) - (borrowing.finePaid || 0) - (borrowing.fineWaived || 0));
    }
    if (amount > 0) {
      total += amount;
      items.push({
        borrowingId: String(borrowing._id),
        bookTitle: borrowing.bookTitle,
        dueDate: borrowing.dueDate,
        status: borrowing.status,
        fineStatus: borrowing.fineStatus,
        amount,
      });
    }
  }
  return { total: Math.round(total * 100) / 100, items };
};

export const settleBorrowingFine = async (borrowing, paymentAmount, payment = {}) => {
  const outstanding = Math.max(
    0,
    (borrowing.finesAccrued || 0) - (borrowing.finePaid || 0) - (borrowing.fineWaived || 0)
  );
  const applied = Math.min(Number(paymentAmount) || 0, outstanding);
  if (applied <= 0) return { applied: 0, outstanding };

  borrowing.finePaid = (borrowing.finePaid || 0) + applied;
  const remaining = Math.max(
    0,
    (borrowing.finesAccrued || 0) - borrowing.finePaid - (borrowing.fineWaived || 0)
  );
  borrowing.fineStatus = remaining <= 0 ? 'paid' : 'partially_paid';
  if (remaining <= 0) borrowing.fineSettledAt = new Date();
  if (payment.reference) borrowing.finePaymentReference = payment.reference;
  await borrowing.save();

  return { applied, outstanding: remaining };
};

export const createPaymentReference = () =>
  `FINE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const recordFinePayment = async ({ borrowing, amount, method, reference, receivedBy, notes }) => {
  const ref = reference || createPaymentReference();
  const payment = await FinePayment.create({
    user: borrowing.student,
    userName: borrowing.studentName,
    identifier: borrowing.matricNumber,
    borrowing: borrowing._id,
    amount: Number(amount) || 0,
    method: method || 'cash',
    reference: ref,
    status: 'completed',
    receivedBy: receivedBy?._id || null,
    paidAt: new Date(),
    notes: notes || null,
  });

  const settlement = await settleBorrowingFine(borrowing, amount, { reference: ref });
  return { payment, ...settlement };
};

export default {
  getFinePolicy,
  calculateFineAmount,
  computeBorrowingFine,
  getOutstandingForUser,
  settleBorrowingFine,
  recordFinePayment,
  createPaymentReference,
};
