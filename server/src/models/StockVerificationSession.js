import mongoose from 'mongoose';

const stockVerificationSessionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
      index: true,
    },
    scope: {
      department: { type: String, default: null },
      category: { type: String, default: null },
      location: { type: String, default: null },
    },
    expectedCount: { type: Number, default: 0 },
    expectedCopyCodes: [{ type: String, trim: true }],
    scannedCount: { type: Number, default: 0 },
    matchedCount: { type: Number, default: 0 },
    missingCount: { type: Number, default: 0 },
    unregisteredCount: { type: Number, default: 0 },
    misplacedCount: { type: Number, default: 0 },
    damagedCount: { type: Number, default: 0 },
    startedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    startedAt: { type: Date, default: Date.now },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedAt: { type: Date, default: null },
    notes: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

stockVerificationSessionSchema.methods.toJSONSafe = function toJSONSafe() {
  return { ...this.toObject(), id: this._id.toString() };
};

const StockVerificationSession = mongoose.model('StockVerificationSession', stockVerificationSessionSchema);

export default StockVerificationSession;
