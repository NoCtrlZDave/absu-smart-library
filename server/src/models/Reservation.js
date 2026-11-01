import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    matricNumber: { type: String, required: true, trim: true, uppercase: true, index: true },
    department: { type: String, default: null, trim: true },

    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    bookTitle: { type: String, required: true, trim: true },
    bookAuthor: { type: String, default: null, trim: true },

    copy: { type: mongoose.Schema.Types.ObjectId, default: null },
    copyCode: { type: String, default: null, trim: true },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'expired', 'fulfilled'],
      default: 'pending',
      index: true,
    },

    reservedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },

    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null, trim: true },

    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: null, trim: true },

    fulfilledAt: { type: Date, default: null },
    borrowing: { type: mongoose.Schema.Types.ObjectId, ref: 'Borrowing', default: null },
    notes: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

reservationSchema.index({ book: 1, status: 1 });
reservationSchema.index({ student: 1, status: 1 });
reservationSchema.index({ status: 1, createdAt: -1 });

reservationSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    ...this.toObject(),
    id: this._id.toString(),
  };
};

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;
