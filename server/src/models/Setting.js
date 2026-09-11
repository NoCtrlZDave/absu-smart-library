import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, default: null },
    value: { type: mongoose.Schema.Types.Mixed, default: null },
    category: { type: String, default: 'general' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const Setting = mongoose.model('Setting', settingSchema);

export default Setting;