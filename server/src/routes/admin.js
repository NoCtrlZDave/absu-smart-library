import express from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Setting from '../models/Setting.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, badRequest, notFound } from '../utils/responses.js';
import logActivity from '../utils/audit.js';

const router = express.Router();
router.use(protect, authorize('admin'));

const ALLOWED_ROLES = ['librarian', 'admin'];

// ----------------------- Users -----------------------

router.get('/users', asyncHandler(async (req, res) => {
  const { role, search, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role && ALLOWED_ROLES.includes(role)) filter.role = role;
  if (status && status !== 'all') filter.isActive = status === 'active';

  const searchRegex = search ? new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
  if (searchRegex) {
    filter.$or = [{ first_name: searchRegex }, { last_name: searchRegex }, { email: searchRegex }];
  }

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((Math.max(1, page) - 1) * limit)
    .limit(Number(limit));
  const total = await User.countDocuments(filter);

  return ok(res, {
    items: users.map((u) => u.toSafeJSON()),
    pagination: { page: Number(page) || 1, limit: Number(limit), total },
  });
}));

router.post(
  '/users',
  [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  asyncHandler(async (req, res) => {
    if (!req.body.first_name || !req.body.last_name || !req.body.email || !req.body.password) {
      return badRequest(res, 'first_name, last_name, email and password are required');
    }
    const role = req.body.role || 'librarian';
    if (!ALLOWED_ROLES.includes(role)) return badRequest(res, `Role must be one of: ${ALLOWED_ROLES.join(', ')}`);

    const existing = await User.findOne({ email: req.body.email.toLowerCase() });
    if (existing) return badRequest(res, 'Email already registered');
    const { first_name, last_name, email, password, phone } = req.body;
    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password,
      role,
      phone: phone || undefined,
      isActive: true,
    });
    await logActivity({ actor: req.user, action: 'USER_CREATED', entity: 'User', entityId: user._id });
    return created(res, user.toSafeJSON(), 'User created');
  })
);

router.patch('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return notFound(res, 'User not found');
  const allowed = ['first_name', 'last_name', 'role', 'phone', 'profileImage', 'isActive'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === 'role' && !ALLOWED_ROLES.includes(req.body[field])) return;
      user[field] = req.body[field];
    }
  });
  await user.save();
  await logActivity({ actor: req.user, action: 'USER_UPDATED', entity: 'User', entityId: user._id });
  return ok(res, user.toSafeJSON(), 'User updated');
}));

router.delete('/users/:id', asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) return badRequest(res, 'You cannot delete your own account');
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return notFound(res, 'User not found');
  await logActivity({ actor: req.user, action: 'USER_DELETED', entity: 'User', entityId: req.params.id });
  return ok(res, null, 'User deleted');
}));

// ----------------------- Librarians -----------------------

router.get('/librarians', asyncHandler(async (req, res) => {
  const librarians = await User.find({ role: 'librarian' }).sort({ createdAt: -1 });
  return ok(res, librarians.map((u) => u.toSafeJSON()));
}));

// ----------------------- Logs -----------------------

router.get('/logs', asyncHandler(async (req, res) => {
  const { action, page = 1, limit = 30 } = req.query;
  const filter = {};
  if (action && action !== 'all') filter.action = action;
  const logs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip((Math.max(1, page) - 1) * limit)
    .limit(Number(limit))
    .lean();
  const total = await AuditLog.countDocuments(filter);
  return ok(res, {
    items: logs.map((l) => ({ ...l, id: l._id.toString() })),
    pagination: { page: Number(page) || 1, limit: Number(limit), total },
  });
}));

// ----------------------- Settings -----------------------

router.get('/settings', asyncHandler(async (req, res) => {
  const settings = await Setting.find().lean();
  return ok(res, settings.map((s) => ({ ...s, id: s._id.toString() })));
}));

router.put('/settings', asyncHandler(async (req, res) => {
  const { settings } = req.body;
  if (!Array.isArray(settings)) return badRequest(res, 'settings must be an array of { key, value, label, category }');

  for (const s of settings) {
    if (!s || !s.key) continue;
    await Setting.findOneAndUpdate(
      { key: s.key },
      {
        value: s.value,
        label: s.label || s.key,
        category: s.category || 'general',
        updatedBy: req.user._id,
      },
      { upsert: true, new: true }
    );
  }

  await logActivity({ actor: req.user, action: 'SETTINGS_UPDATED', entity: 'Setting' });
  const all = await Setting.find().lean();
  return ok(res, all.map((s) => ({ ...s, id: s._id.toString() })), 'Settings saved');
}));

export default router;