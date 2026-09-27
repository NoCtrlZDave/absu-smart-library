import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, badRequest } from '../utils/responses.js';
import {
  getPhysicalLocation,
  getLocationByCategory,
  getFullMap,
  getCategoryMap,
} from '../services/locationMapper.js';

const router = express.Router();

router.get(
  '/map',
  asyncHandler(async (req, res) => ok(res, getFullMap()))
);

router.get(
  '/resolve',
  asyncHandler(async (req, res) => {
    const callNumber = String(req.query.callNumber || '').trim();
    const category = String(req.query.category || '').trim();
    if (!callNumber && !category) {
      return badRequest(res, 'Provide a callNumber or category query parameter');
    }
    const result = callNumber ? getPhysicalLocation(callNumber) : getLocationByCategory(category);
    return ok(res, { callNumber: callNumber || null, category: category || null, ...result });
  })
);

router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const previews = Object.keys(getCategoryMap().categories || {}).map((name) => ({
      category: name,
      ...getLocationByCategory(name),
    }));
    return ok(res, previews);
  })
);

export default router;