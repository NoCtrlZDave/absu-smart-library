import mongoose from 'mongoose';

const stockVerificationScanSchema = new mongoose.Schema(
  {
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'StockVerificationSession', required: true, index: true },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null },
    bookTitle: { type: String, default: null, trim: true },
    copy: { type: mongoose.Schema.Types.ObjectId, default: null },
    copyCode: { type: String, default: null, trim: true },
    accessionNumber: { type: String, default: null, trim: true },
    isbn: { type: String, default: null, trim: true },
    scannedCode: { type: String, required: true, trim: true },
    method: {
      type: String,
      enum: ['barcode', 'qr', 'isbn', 'camera', 'manual'],
      default: 'manual',
    },
    expectedLocation: { type: String, default: null },
    detectedLocation: { type: String, default: null },
    result: {
      type: String,
      enum: ['matched', 'misplaced', 'unregistered', 'duplicate', 'damaged'],
      default: 'matched',
      index: true,
    },
    copyStatus: { type: String, default: null },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    scannedAt: { type: Date, default: Date.now },
    notes: { type: String, default: null, trim: true },
  },
  { timestamps: true }
);

stockVerificationScanSchema.index({ session: 1, scannedCode: 1 });

stockVerificationScanSchema.methods.toJSONSafe = function toJSONSafe() {
  return { ...this.toObject(), id: this._id.toString() };
};

const StockVerificationScan = mongoose.model('StockVerificationScan', stockVerificationScanSchema);

export default StockVerificationScan;
