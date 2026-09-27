import express from 'express';
import LibraryMedia from '../models/LibraryMedia.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload, uploadToCloudinary } from '../middleware/upload.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, badRequest, notFound } from '../utils/responses.js';
import logActivity from '../utils/audit.js';
import { applyLibraryMedia } from '../services/locationMapper.js';

const router = express.Router();

const MEDIA_KEY_PATTERN = /^(entrance|floor:\d+|pillar:\d+|subject:[^/]+)$/;

router.use(protect, authorize('admin', 'librarian'));

const refreshMediaCache = async () => {
  const docs = await LibraryMedia.find().lean();
  applyLibraryMedia(docs.map((d) => ({ ...d, id: undefined })));
};

router.get('/', asyncHandler(async (req, res) => {
  const docs = await LibraryMedia.find().sort({ key: 1 }).lean();
  return ok(res, docs.map((d) => ({ ...d, id: d._id.toString() })));
}));

router.post(
  '/:key',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const key = String(req.params.key || '').trim();
    if (!MEDIA_KEY_PATTERN.test(key)) return badRequest(res, 'Invalid media key. Use entrance, floor:N, pillar:N or subject:NAME');

    const caption = typeof req.body.caption === 'string' && req.body.caption.trim()
      ? req.body.caption.trim()
      : null;
    const update = { caption, updatedBy: req.user._id };

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, `absu-library/media/${key}`);
      update.image = result.secure_url;
    } else if (update.caption === null) {
      return badRequest(res, 'Provide an image file or a caption to update');
    }

    const doc = await LibraryMedia.findOneAndUpdate(
      { key },
      update,
      { upsert: true, new: true }
    );

    await refreshMediaCache();
    await logActivity({ actor: req.user, action: 'MEDIA_UPDATED', entity: 'LibraryMedia', entityId: doc._id, meta: { key } });
    return ok(res, { ...doc.toObject(), id: doc._id.toString() }, 'Library photo updated');
  })
);

router.delete('/:key', asyncHandler(async (req, res) => {
  const key = String(req.params.key || '').trim();
  if (!MEDIA_KEY_PATTERN.test(key)) return badRequest(res, 'Invalid media key');
  const doc = await LibraryMedia.findOneAndDelete({ key });
  if (!doc) return notFound(res, 'No photo saved for that key');
  await refreshMediaCache();
  await logActivity({ actor: req.user, action: 'MEDIA_DELETED', entity: 'LibraryMedia', entityId: doc._id, meta: { key } });
  return ok(res, { key }, 'Library photo removed');
}));

export default router;