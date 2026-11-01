import mongoose from 'mongoose';

const borrowingSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    matricNumber: { type: String, required: true, trim: true, uppercase: true, index: true },
    clientRequestId: { type: String, default: null, trim: true },

    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    bookTitle: { type: String, required: true, trim: true },
    copy: { type: mongoose.Schema.Types.ObjectId, required: true },
    copyCode: { type: String, required: true, trim: true, index: true },

    reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', default: null },

    borrowedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ['active', 'returned', 'lost'],
      default: 'active',
      index: true,
    },

    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    returnCondition: { type: String, default: null, trim: true },
    notes: { type: String, default: null, trim: true },

    patronCategory: { type: String, enum: ['student', 'staff', 'guest'], default: 'student' },

    // Renewal tracking
    renewalCount: { type: Number, default: 0 },
    lastRenewedAt: { type: Date, default: null },
    renewalLimit: { type: Number, default: 2 },

    // Fine tracking
    fineRate: { type: Number, default: null },
    fineGraceDays: { type: Number, default: 0 },
    fineCap: { type: Number, default: 0 },
    finesAccrued: { type: Number, default: 0 },
    fineStatus: {
      type: String,
      enum: ['none', 'outstanding', 'partially_paid', 'paid', 'waived'],
      default: 'none',
      index: true,
    },
    finePaid: { type: Number, default: 0 },
    fineWaived: { type: Number, default: 0 },
    fineSettledAt: { type: Date, default: null },
    finePaymentReference: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

borrowingSchema.index({ student: 1, status: 1 });
borrowingSchema.index({ copy: 1, status: 1 });
borrowingSchema.index(
  { clientRequestId: 1 },
  { unique: true, partialFilterExpression: { clientRequestId: { $type: 'string' } } }
);

borrowingSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    ...this.toObject(),
    id: this._id.toString(),
  };
};

const Borrowing = mongoose.model('Borrowing', borrowingSchema);

export default Borrowing;
