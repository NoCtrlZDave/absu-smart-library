import express from 'express';
import { body } from 'express-validator';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Setting from '../models/Setting.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, badRequest, notFound } from '../utils/responses.js';
import logActivity from '../utils/audit.js';
import {
  DEFAULT_STUDENT_PASSWORD,
  createStudentAccount,
  getStudentOptions,
  importStudentRows,
  validateStudentRows,
} from '../services/studentImport.js';
import { buildMatricValidator, getPolicy, ALL_ROLES, POLICY_DEFAULTS } from '../services/policies.js';
import { ROLE_PERMISSIONS, PERMISSIONS } from '../config/permissions.js';
import { hashActivationToken } from '../services/studentImport.js';
import { getCurrentSession, presentUser } from '../services/academic.js';

const router = express.Router();
router.use(protect, authorize('admin'));

const ALLOWED_ROLES = ALL_ROLES;

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ----------------------- Users -----------------------

router.get('/users', asyncHandler(async (req, res) => {
  const { role, search, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role && ALLOWED_ROLES.includes(role)) filter.role = role;
  if (status && status !== 'all') filter.isActive = status === 'active';

  const searchRegex = search ? new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
  if (searchRegex) {
    filter.$or = [
      { first_name: searchRegex },
      { last_name: searchRegex },
      { email: searchRegex },
      { matricNumber: searchRegex },
    ];
  }

  const [users, total, session] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((Math.max(1, page) - 1) * limit)
      .limit(Number(limit)),
    User.countDocuments(filter),
    getCurrentSession(),
  ]);

  return ok(res, {
    items: users.map((u) => presentUser(u, session)),
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

    const matricNumber = req.body.matricNumber
      ? String(req.body.matricNumber).trim().toUpperCase()
      : undefined;
    const matricPattern = await getPolicy('student.matricPattern');
    if (matricNumber && !buildMatricValidator(matricPattern).test(matricNumber)) {
      return badRequest(res, 'Matriculation number format is not valid');
    }
    if (role === 'student' && !matricNumber) {
      return badRequest(res, 'Matric number is required for student accounts');
    }

    const existing = await User.findOne({ email: req.body.email.toLowerCase() });
    if (existing) return badRequest(res, 'Email already registered');
    if (matricNumber) {
      const existingMatric = await User.findOne({ matricNumber });
      if (existingMatric) return badRequest(res, 'Matric number already registered');
    }

    const { first_name, last_name, email, password, phone, department, faculty, programme, level } = req.body;
    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password,
      role,
      matricNumber,
      department: department || undefined,
      faculty: faculty || undefined,
      programme: programme || undefined,
      level: level || undefined,
      phone: phone || undefined,
      isActive: true,
    });
    await logActivity({ actor: req.user, action: 'USER_CREATED', entity: 'User', entityId: user._id });
    const session = await getCurrentSession();
    return created(res, presentUser(user, session), 'User created');
  })
);

router.patch('/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return notFound(res, 'User not found');
  const allowed = [
    'first_name',
    'last_name',
    'role',
    'matricNumber',
    'department',
    'faculty',
    'programme',
    'level',
    'phone',
    'profileImage',
    'isActive',
  ];
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
  const { action, search } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
  const filter = {};

  if (action && action !== 'all') filter.action = action;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ actorName: rx }, { entity: rx }, { action: rx }, { role: rx }];
  }

  const [logs, total, actions] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
    AuditLog.distinct('action'),
  ]);

  return ok(res, {
    items: logs.map((l) => ({ ...l, id: l._id.toString() })),
    actions: actions.filter(Boolean).sort(),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}));

// ----------------------- Students -----------------------

router.get('/students/options', asyncHandler(async (req, res) => {
  const options = await getStudentOptions();
  return ok(res, options);
}));

router.get('/students', asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  const filter = { role: 'student' };

  if (status && status !== 'all') filter.isActive = status === 'active';

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [
      { first_name: searchRegex },
      { last_name: searchRegex },
      { email: searchRegex },
      { matricNumber: searchRegex },
      { department: searchRegex },
    ];
  }

  const pageNumber = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [items, total, session] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize),
    User.countDocuments(filter),
    getCurrentSession(),
  ]);

  return ok(res, {
    items: items.map((user) => presentUser(user, session)),
    pagination: { page: pageNumber, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}));

router.post('/students', asyncHandler(async (req, res) => {
  const validation = await validateStudentRows([req.body || {}]);
  if (validation.error) return badRequest(res, validation.error);

  const row = validation.rows[0];
  const errors = [...row.errors];
  if (!row.department) errors.push('Department is required');

  if (errors.length) return badRequest(res, errors.join('; '));

  try {
    const user = await createStudentAccount(row);
    await logActivity({
      actor: req.user,
      action: 'STUDENT_CREATED',
      entity: 'User',
      entityId: user._id,
      details: { matricNumber: user.matricNumber, department: user.department, level: user.level },
    });

    const session = await getCurrentSession();
    return created(
      res,
      { user: presentUser(user, session), temporaryPassword: DEFAULT_STUDENT_PASSWORD },
      'Student created'
    );
  } catch (err) {
    if (err.code === 11000) {
      return badRequest(res, 'A student with this matriculation number or email already exists');
    }
    throw err;
  }
}));

// ----------------------- Student Import -----------------------

router.post('/students/import/preview', asyncHandler(async (req, res) => {
  const validation = await validateStudentRows(req.body.rows);
  if (validation.error) return badRequest(res, validation.error);

  const summary = {
    total: validation.rows.length,
    ready: validation.rows.filter((row) => row.status === 'ready').length,
    invalid: validation.rows.filter((row) => row.status === 'invalid').length,
    duplicate: validation.rows.filter((row) => row.status === 'duplicate').length,
  };

  return ok(res, { rows: validation.rows, summary }, 'Import preview generated');
}));

router.post('/students/import', asyncHandler(async (req, res) => {
  const result = await importStudentRows(req.body.rows, req.user);
  if (result.error) return badRequest(res, result.error);

  await logActivity({
    actor: req.user,
    action: 'STUDENTS_BULK_IMPORTED',
    entity: 'User',
    details: result.summary,
  });

  return ok(
    res,
    { rows: result.rows, summary: result.summary, temporaryPassword: result.temporaryPassword },
    'Student import completed'
  );
}));

// ----------------------- Settings -----------------------

router.get('/settings', asyncHandler(async (req, res) => {
  const settings = await Setting.find().lean();
  return ok(res, settings.map((s) => ({ ...s, id: s._id.toString() })));
}));

router.get('/settings/defaults', (req, res) =>
  ok(res, {
    defaults: POLICY_DEFAULTS,
    rolePermissions: ROLE_PERMISSIONS,
    permissions: PERMISSIONS,
  })
);

router.put('/settings', asyncHandler(async (req, res) => {
  const { settings } = req.body;
  if (!Array.isArray(settings)) return badRequest(res, 'settings must be an array of { key, value, label, category }');

  const before = await Setting.find({ key: { $in: settings.map((s) => s?.key).filter(Boolean) } }).lean();
  const beforeMap = new Map(before.map((item) => [item.key, item.value]));
  const changes = [];

  for (const s of settings) {
    if (!s || !s.key) continue;
    const previous = beforeMap.has(s.key) ? beforeMap.get(s.key) : POLICY_DEFAULTS[s.key] ?? null;
    const saved = await Setting.findOneAndUpdate(
      { key: s.key },
      {
        value: s.value,
        label: s.label || s.key,
        category: s.category || 'general',
        updatedBy: req.user._id,
      },
      { upsert: true, new: true }
    );
    if (JSON.stringify(previous) !== JSON.stringify(saved.value)) {
      changes.push({ key: s.key, previous, next: saved.value });
    }
  }

  await logActivity({
    actor: req.user,
    action: 'SETTINGS_UPDATED',
    entity: 'Setting',
    details: { changes },
  });
  const all = await Setting.find().lean();
  return ok(res, all.map((s) => ({ ...s, id: s._id.toString() })), 'Settings saved');
}));

// ----------------------- Password Reset -----------------------

router.patch('/users/:id/reset-password', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return notFound(res, 'User not found');

  const crypto = await import('crypto');
  const temporaryPassword =
    req.body.password ||
    `Absu-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomInt(1000, 9999)}`;

  user.password = temporaryPassword;
  user.mustChangePassword = true;
  user.activationToken = hashActivationToken(temporaryPassword);
  await user.save();

  await logActivity({
    actor: req.user,
    action: 'USER_PASSWORD_RESET',
    entity: 'User',
    entityId: user._id,
    details: { role: user.role },
  });

  return ok(res, { temporaryPassword, mustChangePassword: true }, 'Password reset successfully');
}));

export default router;