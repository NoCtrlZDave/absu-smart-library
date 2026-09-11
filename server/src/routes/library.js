import express from 'express';
import StructureNode from '../models/StructureNode.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created, badRequest, notFound } from '../utils/responses.js';
import logActivity from '../utils/audit.js';

const router = express.Router();

const TYPES = ['library', 'floor', 'section', 'rack', 'shelf'];

router.get('/tree', asyncHandler(async (req, res) => {
  const nodes = await StructureNode.find().sort({ name: 1 }).lean();
  const byId = new Map(nodes.map((n) => [n._id.toString(), { ...n, id: n._id.toString(), children: [] }]));
  const roots = [];
  byId.forEach((node) => {
    if (node.parent && byId.has(node.parent)) {
      byId.get(node.parent).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return ok(res, roots);
}));

router.get('/', asyncHandler(async (req, res) => {
  const { type } = req.query;
  const filter = type ? { type } : {};
  const nodes = await StructureNode.find(filter).sort({ name: 1 }).lean();
  return ok(res, nodes.map((n) => ({ ...n, id: n._id.toString() })));
}));

router.post(
  '/:type',
  protect,
  authorize('librarian', 'admin'),
  asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { name, code, parent, capacity } = req.body;
    if (!TYPES.includes(type)) return badRequest(res, `Type must be one of: ${TYPES.join(', ')}`);
    if (!name) return badRequest(res, 'Name is required');

    if (parent) {
      const parentNode = await StructureNode.findById(parent);
      if (!parentNode) return badRequest(res, 'Parent node not found');
      const order = ['library', 'floor', 'section', 'rack', 'shelf'];
      if (order.indexOf(type) !== order.indexOf(parentNode.type) + 1) {
        return badRequest(res, `A ${parentNode.type} cannot directly contain a ${type}`);
      }
    }

    const node = await StructureNode.create({ type, name, code, parent: parent || null, capacity });
    await logActivity({ actor: req.user, action: `${type.toUpperCase()}_CREATED`, entity: 'StructureNode', entityId: node._id });
    return created(res, node.toJSON(), `${type} created`);
  })
);

router.put(
  '/nodes/:id',
  protect,
  authorize('librarian', 'admin'),
  asyncHandler(async (req, res) => {
    const node = await StructureNode.findById(req.params.id);
    if (!node) return notFound(res, 'Node not found');
    const { name, code, capacity, parent } = req.body;
    if (name) node.name = name;
    if (code !== undefined) node.code = code;
    if (capacity !== undefined) node.capacity = capacity;
    if (parent !== undefined) node.parent = parent || null;
    await node.save();
    await logActivity({ actor: req.user, action: 'NODE_UPDATED', entity: 'StructureNode', entityId: node._id });
    return ok(res, node.toJSON(), 'Node updated');
  })
);

router.delete(
  '/nodes/:id',
  protect,
  authorize('librarian', 'admin'),
  asyncHandler(async (req, res) => {
    const children = await StructureNode.countDocuments({ parent: req.params.id });
    if (children > 0) return badRequest(res, 'Cannot delete: this node has child nodes');
    const node = await StructureNode.findByIdAndDelete(req.params.id);
    if (!node) return notFound(res, 'Node not found');
    await logActivity({ actor: req.user, action: 'NODE_DELETED', entity: 'StructureNode', entityId: req.params.id });
    return ok(res, null, 'Node deleted');
  })
);

export default router;