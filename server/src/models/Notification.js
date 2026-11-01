import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, default: 'info', trim: true },
    event: { type: String, default: null, trim: true, index: true },
    isRead: { type: Boolean, default: false, index: true },
    reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', default: null },
    borrowing: { type: mongoose.Schema.Types.ObjectId, ref: 'Borrowing', default: null },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

notificationSchema.methods.toJSONSafe = function toJSONSafe() {
  return {
    ...this.toObject(),
    id: this._id.toString(),
  };
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
