import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, badRequest, notFound, unauthorized } from '../utils/responses.js';
import logActivity from '../utils/audit.js';

const router = express.Router();

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return badRequest(res, errors.array()[0].msg);
  }
  next();
};

router.post(
  '/login',
  [body('identifier').notEmpty().withMessage('Email is required'), body('password').notEmpty().withMessage('Password is required')],
  validate,
  asyncHandler(async (req, res) => {
    const { password } = req.body;
    const identifier = String(req.body.identifier || '').trim().toLowerCase();

    const user = await User.findOne({ email: identifier });

    if (!user || !(await user.comparePassword(password))) {
      return unauthorized(res, 'Invalid email or password');
    }
    if (!user.isActive) return unauthorized(res, 'Account is not active or has been rejected');
    if (user.role !== 'admin' && user.role !== 'librarian') {
      return unauthorized(res, 'Only administrators and librarians can sign in');
    }

    const token = signToken(user);
    await logActivity({ actor: user, action: 'USER_LOGIN', entity: 'User', entityId: user._id });

    return ok(res, { user: user.toSafeJSON(), token }, 'Login successful');
  })
);

router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => ok(res, req.user.toSafeJSON(), 'Authenticated user'))
);

router.put(
  '/profile',
  protect,
  [
    body('first_name').optional().trim().notEmpty().withMessage('First name is required'),
    body('last_name').optional().trim().notEmpty().withMessage('Last name is required'),
    body('phone').optional().trim(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) return notFound(res, 'User not found');

    if (req.body.first_name !== undefined) user.first_name = String(req.body.first_name).trim();
    if (req.body.last_name !== undefined) user.last_name = String(req.body.last_name).trim();
    if (req.body.phone !== undefined) user.phone = String(req.body.phone).trim() || null;

    await user.save();
    await logActivity({ actor: user, action: 'PROFILE_UPDATED', entity: 'User', entityId: user._id });
    return ok(res, user.toSafeJSON(), 'Profile updated');
  })
);

router.post(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return notFound(res, 'User not found');

    if (!(await user.comparePassword(currentPassword))) {
      return badRequest(res, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();
    await logActivity({ actor: user, action: 'PASSWORD_CHANGED', entity: 'User', entityId: user._id });
    return ok(res, user.toSafeJSON(), 'Password updated');
  })
);

router.post(
  '/forgot-password',
  [body('email').isEmail()],
  validate,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    // Always return success to avoid account enumeration
    if (!user) return ok(res, null, 'If that email exists, a reset link has been sent');
    return ok(res, null, 'If that email exists, a reset link has been sent');
  })
);

router.get('/:id', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return notFound(res, 'User not found');
  return ok(res, user.toSafeJSON());
}));

export default router;