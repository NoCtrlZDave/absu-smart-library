import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { unauthorized } from '../utils/responses.js';
import { userHasAnyPermission } from '../config/permissions.js';

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return unauthorized(res, 'Not authenticated');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return unauthorized(res, 'Account not found or disabled');

    req.user = user;
    next();
  } catch {
    return unauthorized(res, 'Invalid or expired token');
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return unauthorized(res, 'You do not have permission to perform this action');
  }
  next();
};

export const requirePermission = (...permissions) => (req, res, next) => {
  if (!req.user || !userHasAnyPermission(req.user, permissions)) {
    return unauthorized(res, 'You do not have permission to perform this action');
  }
  next();
};

export const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) req.user = user;
  } catch {
    // Ignore invalid tokens for optional endpoints.
  }
  return next();
};
