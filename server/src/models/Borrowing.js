import mongoose from 'mongoose';

const borrowingSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    bookTitle: { type: String, default: null },
    copyCode: { type: String, default: null },
    borrowDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['active', 'returned', 'overdue'],
      default: 'active',
    },
    fine: { type: Number, default: 0 },
    renewedCount: { type: Number, default: 0 },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

borrowingSchema.methods.toFullJSON = async function () {
  const borrower = await mongoose.model('User').findById(this.student).catch(() => null);
  const book = await mongoose.model('Book').findById(this.book).catch(() => null);
  return {
    id: this._id.toString(),
    student_name: borrower
      ? `${borrower.first_name} ${borrower.last_name}`
      : 'Unknown',
    matric_number: borrower?.matric_number || null,
    student_id: borrower?._id?.toString() || null,
    book_id: book?._id?.toString() || null,
    book_title: book?.title || this.bookTitle,
    isbn: book?.isbn || null,
    copy: this.copyCode,
    copy_id: this.copyCode,
    borrow_date: this.borrowDate,
    due_date: this.dueDate,
    return_date: this.returnDate,
    status: this.status,
    fine: this.fine,
    renewed_count: this.renewedCount,
  };
};

const Borrowing = mongoose.model('Borrowing', borrowingSchema);

export default Borrowing;