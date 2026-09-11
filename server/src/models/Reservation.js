import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    bookTitle: { type: String, default: null },
    copyCode: { type: String, default: null },
    reserveDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'available', 'cancelled', 'fulfilled'],
      default: 'pending',
    },
    expiresAt: { type: Date, default: null },
    fulfilledDate: { type: Date, default: null },
  },
  { timestamps: true }
);

reservationSchema.methods.toFullJSON = async function () {
  const student = await mongoose.model('User').findById(this.student).catch(() => null);
  const book = await mongoose.model('Book').findById(this.book).catch(() => null);
  return {
    id: this._id.toString(),
    student_name: student
      ? `${student.first_name} ${student.last_name}`
      : 'Unknown',
    matric_number: student?.matric_number || null,
    student_id: student?._id?.toString() || null,
    book_id: book?._id?.toString() || null,
    book_title: book?.title || this.bookTitle,
    copy: this.copyCode,
    reserve_date: this.reserveDate,
    status: this.status,
    expires_at: this.expiresAt,
  };
};

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;