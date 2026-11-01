import mongoose from 'mongoose';

const notificationDeliverySchema = new mongoose.Schema(
  {
    notification: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', default: null, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    channel: {
      type: String,
      enum: ['email', 'sms', 'whatsapp'],
      required: true,
      index: true,
    },
    destination: { type: String, default: null, trim: true },
    subject: { type: String, default: null, trim: true },
    body: { type: String, default: null },
    status: {
      type: String,
      enum: ['queued', 'sent', 'failed', 'not_configured'],
      default: 'queued',
      index: true,
    },
    provider: { type: String, default: null, trim: true },
    providerReference: { type: String, default: null, trim: true },
    error: { type: String, default: null },
    attempts: { type: Number, default: 0 },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationDeliverySchema.methods.toJSONSafe = function toJSONSafe() {
  return { ...this.toObject(), id: this._id.toString() };
};

const NotificationDelivery = mongoose.model('NotificationDelivery', notificationDeliverySchema);

export default NotificationDelivery;
