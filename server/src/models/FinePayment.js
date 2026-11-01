import mongoose from 'mongoose';

const finePaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, default: null, trim: true },
    identifier: { type: String, default: null, trim: true },
    borrowing: { type: mongoose.Schema.Types.ObjectId, ref: 'Borrowing', default: null, index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'NGN' },
    method: {
      type: String,
      enum: ['cash', 'bank_transfer', 'card', 'online', 'waiver', 'other'],
      default: 'cash',
    },
    reference: { type: String, required: true, unique: true, trim: true },
    status: {
      type: String,
      enum: ['completed', 'pending', 'reversed'],
      default: 'completed',
      index: true,
    },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    paidAt: { type: Date, default: Date.now },
    notes: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

finePaymentSchema.index({ user: 1, paidAt: -1 });

finePaymentSchema.methods.toJSONSafe = function toJSONSafe() {
  return { ...this.toObject(), id: this._id.toString() };
};

const FinePayment = mongoose.model('FinePayment', finePaymentSchema);

export default FinePayment;
