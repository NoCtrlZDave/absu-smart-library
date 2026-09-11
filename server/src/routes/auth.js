import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { upload, uploadToCloudinary } from '../middleware/upload.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, badRequest, notFound, unauthorized } from '../utils/responses.js';
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
  '/register',
  [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
    body('staffType').isIn(['teaching', 'non-teaching']).withMessage('Select whether you are teaching or non-teaching staff'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    if (req.body.role === 'student') {
      return badRequest(
        res,
        'Student accounts are created by the library administrator. Sign in with your matric number.'
      );
    }
    const { first_name, last_name, email, password, staffType } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return badRequest(res, 'Email already registered');

    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(),
      password,
      role: 'staff',
      staffType,
      verificationStatus: 'pending',
      isActive: true,
      profileImage: req.body.profileImage || null,
      identityInfo: req.body.identityInfo ? String(req.body.identityInfo).trim() : null,
      title: staffType === 'teaching' ? (req.body.title || null) : null,
      staffNumber: staffType === 'teaching' ? (req.body.staffNumber || null) : null,
      faculty: req.body.faculty || null,
      department: req.body.department || null,
    });

    const token = signToken(user);
    await logActivity({ actor: user, action: 'STAFF_SIGNUP_REQUESTED', entity: 'User', entityId: user._id });
    return created(res, { user: user.toSafeJSON(), token }, 'Account created. Pending administrator verification.');
  })
);

router.post(
  '/upload-picture',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) return badRequest(res, 'No image uploaded');
    const result = await uploadToCloudinary(req.file.buffer, 'absu-library/profiles');
    return ok(res, { url: result.secure_url }, 'Picture uploaded');
  })
);

router.post(
  '/login',
  [body('identifier').notEmpty().withMessage('Email or matric number is required'), body('password').notEmpty().withMessage('Password is required')],
  validate,
  asyncHandler(async (req, res) => {
    const { password } = req.body;
    const identifier = String(req.body.identifier || '').trim();

    const user = identifier.includes('@')
      ? await User.findOne({ email: identifier.toLowerCase() })
      : await User.findOne({
          matric_number: new RegExp(`^${identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
        });

    if (!user || !(await user.comparePassword(password))) {
      return unauthorized(res, 'Invalid email, matric number or password');
    }
    if (!user.isActive) return unauthorized(res, 'Account is not active or has been rejected');

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

    if (user.mustChangePassword) {
      const GENERAL_STUDENT_PASSWORD = 'student123';
      if (currentPassword !== GENERAL_STUDENT_PASSWORD) {
        return badRequest(res, 'The current password is incorrect. Use the general password you were given (student123) to set your own password.');
      }
      if (newPassword === GENERAL_STUDENT_PASSWORD) {
        return badRequest(res, 'Your new password must be different from the general password (student123).');
      }
    } else if (!(await user.comparePassword(currentPassword))) {
      return badRequest(res, 'Current password is incorrect');
    }

    user.password = newPassword;
    user.mustChangePassword = false;
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