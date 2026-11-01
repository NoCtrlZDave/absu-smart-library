import mongoose from 'mongoose';

const renewalRequestSchema = new mongoose.Schema(
  {
    borrowing: { type: mongoose.Schema.Types.ObjectId, ref: 'Borrowing', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, default: null, trim: true },
    identifier: { type: String, default: null, trim: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    bookTitle: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    reason: { type: String, default: null, trim: true },
    previousDueDate: { type: Date, default: null },
    newDueDate: { type: Date, default: null },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

renewalRequestSchema.index({ borrowing: 1, status: 1 });

renewalRequestSchema.methods.toJSONSafe = function toJSONSafe() {
  return { ...this.toObject(), id: this._id.toString() };
};

const RenewalRequest = mongoose.model('RenewalRequest', renewalRequestSchema);

export default RenewalRequest;
