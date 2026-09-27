import mongoose from 'mongoose';

const libraryMediaSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    image: { type: String, default: null },
    caption: { type: String, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const LibraryMedia = mongoose.model('LibraryMedia', libraryMediaSchema);

export default LibraryMedia;