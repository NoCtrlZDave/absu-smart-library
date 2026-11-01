import Book from '../models/Book.js';
import Reservation from '../models/Reservation.js';
import { getPolicy } from './policies.js';
import { sendNotification } from './notifications.js';

const AVAILABLE_COPY_STATUSES = ['available', 'verified'];

export const isCopyAvailable = (status) => AVAILABLE_COPY_STATUSES.includes(status);

export const countCopyStatuses = (copies = []) => {
  const counts = {
    total: copies.length,
    available: 0,
    reserved: 0,
    borrowed: 0,
    damaged: 0,
    missing: 0,
    misplaced: 0,
    other: 0,
  };

  copies.forEach((copy) => {
    if (AVAILABLE_COPY_STATUSES.includes(copy.status)) counts.available += 1;
    else if (copy.status === 'reserved') counts.reserved += 1;
    else if (copy.status === 'borrowed') counts.borrowed += 1;
    else if (copy.status === 'damaged') counts.damaged += 1;
    else if (copy.status === 'missing') counts.missing += 1;
    else if (copy.status === 'misplaced') counts.misplaced += 1;
    else counts.other += 1;
  });

  counts.unavailable = counts.total - counts.available;
  return counts;
};

export const getReservationsByBook = async (bookIds = []) => {
  if (!bookIds.length) return new Map();

  const rows = await Reservation.aggregate([
    {
      $match: {
        book: { $in: bookIds },
        status: { $in: ['pending', 'approved'] },
      },
    },
    {
      $group: {
        _id: { book: '$book', status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]);

  const map = new Map();
  rows.forEach((row) => {
    const key = String(row._id.book);
    const current = map.get(key) || { pending: 0, approved: 0 };
    current[row._id.status] = row.count;
    map.set(key, current);
  });
  return map;
};

export const buildInventoryRow = (book, reservationCounts = { pending: 0, approved: 0 }) => {
  const counts = countCopyStatuses(book.copies || []);
  return {
    id: String(book._id),
    title: book.title,
    author: (book.authors || []).join(', '),
    category: book.category,
    location: book.locationString,
    totalCopies: counts.total,
    availableCopies: counts.available,
    reservedCopies: counts.reserved,
    borrowedCopies: counts.borrowed,
    damagedCopies: counts.damaged,
    missingCopies: counts.missing,
    misplacedCopies: counts.misplaced,
    otherUnavailableCopies: counts.other,
    unavailableCopies: counts.unavailable,
    pendingReservations: reservationCounts.pending || 0,
    approvedReservations: reservationCounts.approved || 0,
  };
};

export const getInventoryForBooks = async (filter = {}) => {
  const books = await Book.find(filter).lean();
  const reservationMap = await getReservationsByBook(books.map((book) => book._id));
  return books.map((book) =>
    buildInventoryRow(book, reservationMap.get(String(book._id)) || { pending: 0, approved: 0 })
  );
};

export const notifyUser = async ({ user, title, message, type = 'info', event = null, data = {}, channels = [], reservation, borrowing, book }) => {
  if (!user) return null;
  try {
    return await sendNotification({
      user,
      title,
      message,
      type,
      event,
      data,
      channels,
      reservation: reservation || null,
      borrowing: borrowing || null,
      book: book || null,
    });
  } catch (err) {
    console.error('Notification write failed:', err.message);
    return null;
  }
};

export const releaseReservedCopy = async (reservation) => {
  if (!reservation?.book || !reservation?.copy) return false;
  const result = await Book.updateOne(
    {
      _id: reservation.book,
      copies: {
        $elemMatch: {
          _id: reservation.copy,
          status: 'reserved',
        },
      },
    },
    {
      $set: {
        'copies.$.status': 'available',
        'copies.$.reservedBy': null,
        'copies.$.reservedUntil': null,
      },
    }
  );
  return result.modifiedCount > 0;
};

export const expireStaleReservations = async () => {
  const now = new Date();
  const stale = await Reservation.find({
    status: 'approved',
    expiresAt: { $ne: null, $lte: now },
  }).limit(200);

  let expired = 0;
  for (const reservation of stale) {
    const won = await Reservation.findOneAndUpdate(
      { _id: reservation._id, status: 'approved', expiresAt: { $lte: now } },
      { $set: { status: 'expired' } },
      { new: true }
    );
    if (!won) continue;

    await releaseReservedCopy(won);
    await notifyUser({
      user: won.student,
      title: 'Reservation expired',
      message: `Your reservation for "${won.bookTitle}" expired because it was not collected before the deadline.`,
      type: 'warning',
      reservation: won._id,
      book: won.book,
    });
    expired += 1;
  }
  return expired;
};

export const getCollectionDeadline = async (from = new Date()) => {
  const days = await getPolicy('reservation.collectionDays');
  if (!days) return null;
  const deadline = new Date(from);
  deadline.setDate(deadline.getDate() + days);
  return deadline;
};

export const getLoanDueDate = async (from = new Date()) => {
  const days = await getPolicy('borrowing.loanDays');
  const due = new Date(from);
  due.setDate(due.getDate() + days);
  return due;
};

export const getMaxActiveBorrowings = () => getPolicy('borrowing.maxActive');

export default {
  countCopyStatuses,
  getReservationsByBook,
  buildInventoryRow,
  getInventoryForBooks,
  notifyUser,
  releaseReservedCopy,
  expireStaleReservations,
  getCollectionDeadline,
  getLoanDueDate,
  getMaxActiveBorrowings,
  isCopyAvailable,
};
