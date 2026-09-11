import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { unauthorized } from '../utils/responses.js';

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