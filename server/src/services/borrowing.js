import Book from '../models/Book.js';
import Borrowing from '../models/Borrowing.js';
import Reservation from '../models/Reservation.js';
import RenewalRequest from '../models/RenewalRequest.js';
import User from '../models/User.js';
import { getLoanDueDate, notifyUser, releaseReservedCopy } from './circulation.js';
import { getPolicy, getRolePolicy, resolvePatronCategory, addDays } from './policies.js';
import { calculateFineAmount, getFinePolicy } from './fines.js';
import logActivity from '../utils/audit.js';

class CirculationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
    this.statusCode = status;
  }
}

const studentLabel = (student) =>
  `${student.first_name || ''} ${student.last_name || ''}`.trim() || student.matricNumber || 'Student';

const userIdentifier = (user) => user.matricNumber || user.staffId || user.email || null;

export const getPatronPolicy = async (student) => {
  const role = student?.role || 'student';
  const policy = await getRolePolicy(role);
  return { ...policy, category: resolvePatronCategory(role) };
};

const resolveDueDate = async (dueDate, loanDays) => {
  if (!dueDate) return getLoanDueDate(loanDays);
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) throw new CirculationError('Invalid due date');
  if (parsed <= new Date()) throw new CirculationError('Due date must be in the future');
  return parsed;
};

const checkReservationLimit = async (student) => {
  const category = resolvePatronCategory(student.role);
  const limit = await getPolicy(`reservation.${category === 'staff' ? 'staff' : category}Limit`);
  if (!limit) return;
  const activeReservations = await Reservation.countDocuments({
    student: student._id,
    status: { $in: ['pending', 'approved'] },
  });
  if (activeReservations >= limit) {
    throw new CirculationError(`This ${category} has reached the maximum of ${limit} active reservations`);
  }
};

export const checkEligibility = async (student, book, roleOverride) => {
  if (!student) throw new CirculationError('A valid user account is required');
  if (!student.isActive) throw new CirculationError('This user account is inactive');

  const policy = await getPatronPolicy(roleOverride ? { ...student, role: roleOverride } : student);

  if (policy.maxActive <= 0) {
    throw new CirculationError('This user category is not permitted to borrow library materials');
  }

  const [activeCount, duplicate] = await Promise.all([
    Borrowing.countDocuments({ student: student._id, status: 'active' }),
    Borrowing.findOne({ student: student._id, book: book._id, status: 'active' }),
  ]);

  if (duplicate) throw new CirculationError('This user already has an active loan for this book');
  if (activeCount >= policy.maxActive) {
    throw new CirculationError(
      `This ${policy.category} has reached the maximum of ${policy.maxActive} active loans`
    );
  }

  await checkReservationLimit(student);
  return policy;
};

const createBorrowingRecord = async ({ student, book, copy, dueDate, issuedBy, reservation, policy }) => {
  return Borrowing.create({
    student: student._id,
    studentName: studentLabel(student),
    matricNumber: userIdentifier(student) || 'N/A',
    book: book._id,
    bookTitle: book.title,
    copy: copy._id,
    copyCode: copy.code,
    reservation: reservation?._id || null,
    borrowedAt: new Date(),
    dueDate,
    status: 'active',
    issuedBy: issuedBy?._id || null,
    patronCategory: policy.category,
    renewalCount: 0,
    renewalLimit: policy.renewalLimit,
    fineRate: policy.fineRate,
    fineGraceDays: policy.gracePeriodDays,
    fineCap: policy.maxFine,
    finesAccrued: 0,
    fineStatus: 'none',
  });
};

const revertCopyToAvailable = async (bookId, copyId) => {
  await Book.updateOne(
    { _id: bookId, copies: { $elemMatch: { _id: copyId, status: 'borrowed' } } },
    {
      $set: {
        'copies.$.status': 'available',
        'copies.$.borrower': null,
        'copies.$.dueDate': null,
      },
    }
  );
};

export const issueBook = async ({ student, book, copyId, copyCode, dueDate, issuedBy, reservation, role }) => {
  if (!book) throw new CirculationError('Book is required');
  if (!student) throw new CirculationError('User is required');

  const policy = await checkEligibility(student, book, role);

  const copy =
    (copyId && book.copies.id(copyId)) ||
    (copyCode && book.copies.find((item) => item.code === copyCode)) ||
    null;

  if (!copy) throw new CirculationError('Physical copy not found', 404);
  if (reservation && String(reservation.copy) !== String(copy._id)) {
    throw new CirculationError('This copy is not assigned to the reservation');
  }

  const resolvedDueDate = await resolveDueDate(dueDate, policy.loanDays);
  const expectedStatuses = reservation ? ['reserved'] : ['available', 'verified'];

  const update = {
    $set: {
      'copies.$.status': 'borrowed',
      'copies.$.borrower': `${studentLabel(student)} (${userIdentifier(student) || 'N/A'})`,
      'copies.$.dueDate': resolvedDueDate.toISOString(),
      'copies.$.reservedBy': null,
      'copies.$.reservedUntil': null,
    },
  };

  const updatedBook = await Book.findOneAndUpdate(
    {
      _id: book._id,
      copies: {
        $elemMatch: {
          _id: copy._id,
          status: { $in: expectedStatuses },
        },
      },
    },
    update,
    { new: true }
  );

  if (!updatedBook) throw new CirculationError('This copy is no longer available for borrowing');

  let borrowing;
  try {
    borrowing = await createBorrowingRecord({
      student,
      book,
      copy,
      dueDate: resolvedDueDate,
      issuedBy,
      reservation,
      policy,
    });
  } catch (err) {
    await revertCopyToAvailable(book._id, copy._id);
    throw err;
  }

  if (reservation) {
    const claimed = await Reservation.findOneAndUpdate(
      { _id: reservation._id, status: 'approved' },
      {
        $set: {
          status: 'fulfilled',
          fulfilledAt: new Date(),
          borrowing: borrowing._id,
          processedBy: issuedBy?._id || null,
          processedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!claimed) {
      await Borrowing.deleteOne({ _id: borrowing._id });
      await revertCopyToAvailable(book._id, copy._id);
      throw new CirculationError('This reservation is no longer available to collect', 409);
    }
  }

  await notifyUser({
    user: student._id,
    title: 'Book issued',
    message: `"${book.title}" was issued to you. Please return it by ${resolvedDueDate.toLocaleDateString()}.`,
    type: 'success',
    event: 'book_issued',
    data: { bookTitle: book.title, dueDate: resolvedDueDate.toLocaleDateString() },
    borrowing: borrowing._id,
    book: book._id,
    reservation: reservation?._id,
  });

  return borrowing;
};

export const collectReservation = async ({ reservationId, dueDate, issuedBy }) => {
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) throw new CirculationError('Reservation not found', 404);
  if (reservation.status !== 'approved') throw new CirculationError('Only approved reservations can be collected');

  if (reservation.expiresAt && reservation.expiresAt <= new Date()) {
    const won = await Reservation.findOneAndUpdate(
      { _id: reservation._id, status: 'approved' },
      { $set: { status: 'expired' } },
      { new: true }
    );
    if (won) {
      await releaseReservedCopy(won);
      await notifyUser({
        user: won.student,
        title: 'Reservation expired',
        message: `Your reservation for "${won.bookTitle}" expired before collection.`,
        type: 'warning',
        reservation: won._id,
        book: won.book,
      });
    }
    throw new CirculationError('This reservation has expired');
  }

  const [student, book] = await Promise.all([
    User.findById(reservation.student),
    Book.findById(reservation.book),
  ]);

  if (!student) throw new CirculationError('Student account no longer exists', 404);
  if (!book) throw new CirculationError('Book no longer exists', 404);

  return issueBook({
    student,
    book,
    copyId: reservation.copy,
    dueDate,
    issuedBy,
    reservation,
  });
};

export const returnBorrowing = async ({ borrowingId, returnedBy, condition, notes }) => {
  const borrowing = await Borrowing.findById(borrowingId);
  if (!borrowing) throw new CirculationError('Borrowing record not found', 404);
  if (borrowing.status !== 'active') throw new CirculationError('This loan is not active');

  const returnedAt = new Date();
  const normalizedCondition = String(condition || 'good').trim().toLowerCase();
  const copyStatus = ['damaged', 'poor', 'unusable'].includes(normalizedCondition) ? 'damaged' : 'available';

  const finePolicy = await getFinePolicy(borrowing.patronCategory || borrowing.role || 'student');
  const { days, amount } = calculateFineAmount({
    dueDate: borrowing.dueDate,
    asOf: returnedAt,
    rate: borrowing.fineRate || finePolicy.rate,
    gracePeriodDays: borrowing.fineGraceDays ?? finePolicy.gracePeriodDays,
    maxFine: borrowing.fineCap || finePolicy.maxFine,
    enabled: finePolicy.enabled,
  });

  const totalAccrued = (borrowing.finesAccrued || 0) + amount;
  const fineStatus =
    amount > 0
      ? (borrowing.finePaid || 0) >= totalAccrued
        ? 'paid'
        : 'outstanding'
      : borrowing.fineStatus === 'outstanding'
        ? 'outstanding'
        : 'none';

  const won = await Borrowing.findOneAndUpdate(
    { _id: borrowing._id, status: 'active' },
    {
      $set: {
        status: 'returned',
        returnedAt,
        returnedBy: returnedBy?._id || null,
        returnCondition: normalizedCondition,
        notes: notes || borrowing.notes || null,
        finesAccrued: totalAccrued,
        fineStatus,
      },
    },
    { new: true }
  );

  if (!won) throw new CirculationError('This loan was already returned', 409);

  await Book.updateOne(
    {
      _id: won.book,
      copies: { $elemMatch: { _id: won.copy, status: 'borrowed' } },
    },
    {
      $set: {
        'copies.$.status': copyStatus,
        'copies.$.borrower': null,
        'copies.$.dueDate': null,
      },
    }
  );

  const fineMessage =
    amount > 0
      ? `Fine of NGN ${amount.toLocaleString()} accrued for ${days} overdue day(s).`
      : 'No fine accrued - book returned on time.';

  await notifyUser({
    user: won.student,
    title: 'Book returned',
    message: `"${won.bookTitle}" has been recorded as returned. ${fineMessage} Thank you.`,
    type: amount > 0 ? 'warning' : 'success',
    event: 'book_returned',
    data: { bookTitle: won.bookTitle, fineMessage, fine: amount },
    borrowing: won._id,
    book: won.book,
  });

  return won;
};

export const getRenewalEligibility = async (borrowing) => {
  if (!borrowing) return { eligible: false, reason: 'Borrowing record not found' };
  if (borrowing.status !== 'active') return { eligible: false, reason: 'Only active loans can be renewed' };

  const policy = await getPatronPolicy({ role: borrowing.patronCategory === 'staff' ? 'staff' : borrowing.patronCategory });
  const renewalLimit = borrowing.renewalLimit ?? policy.renewalLimit;
  const renewalCount = borrowing.renewalCount || 0;

  if (renewalLimit <= 0) return { eligible: false, reason: 'Renewals are not permitted for this user category' };
  if (renewalCount >= renewalLimit) {
    return { eligible: false, reason: `The renewal limit of ${renewalLimit} has been reached` };
  }

  const [renewOnlyIfNotOverdue, blockOnReservation] = await Promise.all([
    getPolicy('borrowing.renewOnlyIfNotOverdue'),
    getPolicy('borrowing.blockRenewalOnReservation'),
  ]);

  if (renewOnlyIfNotOverdue && new Date(borrowing.dueDate) < new Date()) {
    return { eligible: false, reason: 'Overdue loans cannot be renewed. Please return the book and pay any fine.' };
  }

  if (blockOnReservation) {
    const activeReservation = await Reservation.findOne({
      book: borrowing.book,
      student: { $ne: borrowing.student },
      status: { $in: ['pending', 'approved'] },
    }).lean();
    if (activeReservation) {
      return {
        eligible: false,
        reason: 'This book has an active reservation by another user and cannot be renewed',
      };
    }
  }

  const renewalDays = policy.renewalDays || (await getPolicy('borrowing.renewalDays'));
  const base = Math.max(new Date(borrowing.dueDate).getTime(), Date.now());
  return {
    eligible: true,
    renewalDays,
    newDueDate: addDays(new Date(base), renewalDays),
    remainingRenewals: Math.max(0, renewalLimit - renewalCount),
  };
};

export const renewBorrowingDirect = async ({ borrowingId, renewedBy, notes }) => {
  const borrowing = await Borrowing.findById(borrowingId);
  const eligibility = await getRenewalEligibility(borrowing);
  if (!eligibility.eligible) throw new CirculationError(eligibility.reason);

  const newDueDate = eligibility.newDueDate;
  const won = await Borrowing.findOneAndUpdate(
    { _id: borrowing._id, status: 'active', renewalCount: borrowing.renewalCount || 0 },
    {
      $set: {
        dueDate: newDueDate,
        lastRenewedAt: new Date(),
        notes: notes || borrowing.notes || null,
      },
      $inc: { renewalCount: 1 },
    },
    { new: true }
  );

  if (!won) throw new CirculationError('Renewal could not be processed. Please refresh and try again.', 409);

  await Book.updateOne(
    { _id: won.book, copies: { $elemMatch: { _id: won.copy, status: 'borrowed' } } },
    { $set: { 'copies.$.dueDate': newDueDate.toISOString() } }
  );

  await notifyUser({
    user: won.student,
    title: 'Loan renewed',
    message: `Your loan of "${won.bookTitle}" was renewed. The new due date is ${newDueDate.toLocaleDateString()}.`,
    type: 'success',
    event: 'renewal_approved',
    data: { bookTitle: won.bookTitle, dueDate: newDueDate.toLocaleDateString() },
    borrowing: won._id,
    book: won.book,
  });

  await logActivity({
    actor: renewedBy,
    action: 'LOAN_RENEWED',
    entity: 'Borrowing',
    entityId: won._id,
    details: { newDueDate, renewalCount: won.renewalCount },
  });

  return won;
};

export const requestRenewal = async ({ borrowingId, user, reason }) => {
  const borrowing = await Borrowing.findById(borrowingId);
  if (!borrowing) throw new CirculationError('Borrowing record not found', 404);
  if (String(borrowing.student) !== String(user._id)) {
    throw new CirculationError('You can only request renewal for your own loans', 403);
  }

  const eligibility = await getRenewalEligibility(borrowing);
  if (!eligibility.eligible) throw new CirculationError(eligibility.reason);

  const existing = await RenewalRequest.findOne({ borrowing: borrowing._id, status: 'pending' });
  if (existing) throw new CirculationError('A renewal request for this loan is already pending');

  const request = await RenewalRequest.create({
    borrowing: borrowing._id,
    user: borrowing.student,
    userName: borrowing.studentName,
    identifier: borrowing.matricNumber,
    book: borrowing.book,
    bookTitle: borrowing.bookTitle,
    status: 'pending',
    reason: reason || null,
    previousDueDate: borrowing.dueDate,
    newDueDate: null,
  });

  await logActivity({
    actor: user,
    action: 'RENEWAL_REQUESTED',
    entity: 'RenewalRequest',
    entityId: request._id,
    details: { borrowing: borrowing._id, book: borrowing.bookTitle },
  });

  return request;
};

export const approveRenewalRequest = async ({ requestId, processedBy }) => {
  const request = await RenewalRequest.findById(requestId);
  if (!request) throw new CirculationError('Renewal request not found', 404);
  if (request.status !== 'pending') throw new CirculationError('Only pending renewal requests can be approved');

  const borrowing = await Borrowing.findById(request.borrowing);
  const eligibility = await getRenewalEligibility(borrowing);
  if (!eligibility.eligible) throw new CirculationError(eligibility.reason);

  const newDueDate = eligibility.newDueDate;
  const updated = await Borrowing.findOneAndUpdate(
    { _id: borrowing._id, status: 'active', renewalCount: borrowing.renewalCount || 0 },
    {
      $set: { dueDate: newDueDate, lastRenewedAt: new Date() },
      $inc: { renewalCount: 1 },
    },
    { new: true }
  );
  if (!updated) throw new CirculationError('This loan changed while processing. Please refresh.', 409);

  const won = await RenewalRequest.findOneAndUpdate(
    { _id: request._id, status: 'pending' },
    {
      $set: {
        status: 'approved',
        newDueDate,
        processedBy: processedBy?._id || null,
        processedAt: new Date(),
      },
    },
    { new: true }
  );
  if (!won) throw new CirculationError('This renewal request was already processed', 409);

  await Book.updateOne(
    { _id: updated.book, copies: { $elemMatch: { _id: updated.copy, status: 'borrowed' } } },
    { $set: { 'copies.$.dueDate': newDueDate.toISOString() } }
  );

  await notifyUser({
    user: updated.student,
    title: 'Renewal approved',
    message: `Your renewal request for "${updated.bookTitle}" was approved. New due date: ${newDueDate.toLocaleDateString()}.`,
    type: 'success',
    event: 'renewal_approved',
    data: { bookTitle: updated.bookTitle, dueDate: newDueDate.toLocaleDateString() },
    borrowing: updated._id,
    book: updated.book,
  });

  await logActivity({
    actor: processedBy,
    action: 'RENEWAL_APPROVED',
    entity: 'RenewalRequest',
    entityId: won._id,
    details: { borrowing: updated._id, newDueDate },
  });

  return { request: won, borrowing: updated };
};

export const rejectRenewalRequest = async ({ requestId, processedBy, reason }) => {
  const won = await RenewalRequest.findOneAndUpdate(
    { _id: requestId, status: 'pending' },
    {
      $set: {
        status: 'rejected',
        rejectionReason: reason || null,
        processedBy: processedBy?._id || null,
        processedAt: new Date(),
      },
    },
    { new: true }
  );
  if (!won) {
    const existing = await RenewalRequest.findById(requestId);
    if (!existing) throw new CirculationError('Renewal request not found', 404);
    throw new CirculationError('Only pending renewal requests can be rejected');
  }

  await notifyUser({
    user: won.user,
    title: 'Renewal rejected',
    message: `Your renewal request for "${won.bookTitle}" was rejected${reason ? `: ${reason}` : '.'}`,
    type: 'warning',
    event: 'renewal_rejected',
    data: { bookTitle: won.bookTitle, reason: reason || '' },
    borrowing: won.borrowing,
    book: won.book,
  });

  await logActivity({
    actor: processedBy,
    action: 'RENEWAL_REJECTED',
    entity: 'RenewalRequest',
    entityId: won._id,
    details: { reason },
  });

  return won;
};

export const serializeBorrowing = (borrowing) => {
  const obj = borrowing.toJSONSafe ? borrowing.toJSONSafe() : { ...borrowing, id: String(borrowing._id) };
  obj.isOverdue = obj.status === 'active' && new Date(obj.dueDate) < new Date();
  obj.patronCategory = borrowing.patronCategory || 'student';
  obj.renewalCount = borrowing.renewalCount || 0;
  obj.renewalLimit = borrowing.renewalLimit ?? 0;
  obj.fineRate = borrowing.fineRate ?? 0;
  obj.finesAccrued = borrowing.finesAccrued || 0;
  obj.finePaid = borrowing.finePaid || 0;
  obj.fineStatus = borrowing.fineStatus || 'none';
  return obj;
};

export { CirculationError };
export default {
  issueBook,
  collectReservation,
  returnBorrowing,
  getRenewalEligibility,
  renewBorrowingDirect,
  requestRenewal,
  approveRenewalRequest,
  rejectRenewalRequest,
  serializeBorrowing,
};
