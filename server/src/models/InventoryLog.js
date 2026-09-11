import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    bookTitle: { type: String, default: null },
    copyCode: { type: String, default: null },
    type: {
      type: String,
      enum: ['scan', 'verified', 'missing', 'misplaced', 'damaged', 'found'],
      default: 'scan',
    },
    expectedLocation: { type: String, default: null },
    detectedLocation: { type: String, default: null },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    notes: { type: String, default: null },
    readerId: { type: String, default: null },
  },
  { timestamps: true }
);

const InventoryLog = mongoose.model('InventoryLog', inventoryLogSchema);

export default InventoryLog;