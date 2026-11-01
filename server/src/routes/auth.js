import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, badRequest, notFound, unauthorized } from '../utils/responses.js';
import logActivity from '../utils/audit.js';
import { hashActivationToken } from '../services/studentImport.js';
import { getCurrentSession, presentUser } from '../services/academic.js';

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
  [
    body('identifier').notEmpty().withMessage('Email or matric number is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { password } = req.body;
    const identifier = String(req.body.identifier || '').trim();
    const isEmail = identifier.includes('@');

    const user = await User.findOne(
      isEmail
        ? { email: identifier.toLowerCase() }
        : {
            $or: [
              { matricNumber: identifier.toUpperCase() },
              { staffId: identifier.toUpperCase() },
            ],
          }
    );

    if (!user || !(await user.comparePassword(password))) {
      return unauthorized(res, 'Invalid email, matriculation number, staff ID, or password');
    }
    if (!user.isActive) return unauthorized(res, 'Account is not active or has been rejected');

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user);
    await logActivity({ actor: user, action: 'USER_LOGIN', entity: 'User', entityId: user._id });

    const session = await getCurrentSession();
    return ok(res, { user: presentUser(user, session), token }, 'Login successful');
  })
);

router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const session = await getCurrentSession();
    return ok(res, presentUser(req.user, session), 'Authenticated user');
  })
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
    const session = await getCurrentSession();
    return ok(res, presentUser(user, session), 'Profile updated');
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
    user.mustChangePassword = false;
    await user.save();
    await logActivity({ actor: user, action: 'PASSWORD_CHANGED', entity: 'User', entityId: user._id });
    const session = await getCurrentSession();
    return ok(res, presentUser(user, session), 'Password updated');
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

router.get('/activation/:token', asyncHandler(async (req, res) => {
  const tokenHash = hashActivationToken(req.params.token);
  const user = await User.findOne({ activationToken: tokenHash }).select(
    '+activationToken +activationExpiresAt'
  );

  if (!user) return notFound(res, 'This activation link is invalid');
  if (user.isActive) return badRequest(res, 'This account has already been activated');
  if (user.activationExpiresAt && user.activationExpiresAt < new Date()) {
    return badRequest(res, 'This activation link has expired. Contact the library administrator.');
  }

  return ok(
    res,
    {
      first_name: user.first_name,
      last_name: user.last_name,
      matricNumber: user.matricNumber,
      email: user.email,
      expiresAt: user.activationExpiresAt,
    },
    'Activation link is valid'
  );
}));

router.post('/activate', asyncHandler(async (req, res) => {
  const token = String(req.body.token || '').trim();
  const password = String(req.body.password || '');
  if (!token) return badRequest(res, 'Activation token is required');
  if (password.length < 8) return badRequest(res, 'Password must be at least 8 characters');

  const user = await User.findOne({ activationToken: hashActivationToken(token) }).select(
    '+activationToken +activationExpiresAt'
  );
  if (!user) return badRequest(res, 'This activation link is invalid');
  if (user.isActive) return badRequest(res, 'This account has already been activated');
  if (user.activationExpiresAt && user.activationExpiresAt < new Date()) {
    return badRequest(res, 'This activation link has expired. Contact the library administrator.');
  }

  user.password = password;
  user.isActive = true;
  user.activationToken = null;
  user.activationExpiresAt = null;
  await user.save();

  await logActivity({ actor: user, action: 'ACCOUNT_ACTIVATED', entity: 'User', entityId: user._id });
  const session = await getCurrentSession();
  return ok(res, presentUser(user, session), 'Account activated. You can now sign in.');
}));

router.get('/:id', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return notFound(res, 'User not found');
  const session = await getCurrentSession();
  return ok(res, presentUser(user, session));
}));

export default router;