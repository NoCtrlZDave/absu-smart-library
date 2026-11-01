import express from 'express';
import Notification from '../models/Notification.js';
import NotificationDelivery from '../models/NotificationDelivery.js';
import Setting from '../models/Setting.js';
import { protect, requirePermission } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, notFound, badRequest } from '../utils/responses.js';
import logActivity from '../utils/audit.js';
import { PERMISSIONS } from '../config/permissions.js';
import {
  EVENT_TEMPLATES,
  getTemplate,
  getNotificationIntegrationStatus,
  sendDueReminders,
  sendNotification,
} from '../services/notifications.js';

const router = express.Router();

router.get('/my', protect, asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const filter = { user: req.user._id };
  if (String(req.query.unreadOnly) === 'true') filter.isRead = false;

  const [items, total, unread] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  return ok(res, {
    items: items.map((item) => item.toJSONSafe()),
    unread,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}));

router.patch('/read-all', protect, asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { $set: { isRead: true } });
  return ok(res, null, 'All notifications marked as read');
}));

router.patch('/:id/read', protect, asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { $set: { isRead: true } },
    { new: true }
  );
  if (!notification) return notFound(res, 'Notification not found');
  return ok(res, notification.toJSONSafe(), 'Notification marked as read');
}));

router.get(
  '/integration-status',
  protect,
  requirePermission(PERMISSIONS.NOTIFICATIONS_MANAGE),
  asyncHandler(async (req, res) => ok(res, getNotificationIntegrationStatus()))
);

router.get(
  '/deliveries',
  protect,
  requirePermission(PERMISSIONS.NOTIFICATIONS_MANAGE),
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const filter = {};
    if (req.query.channel) filter.channel = req.query.channel;
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      NotificationDelivery.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      NotificationDelivery.countDocuments(filter),
    ]);

    return ok(res, {
      items: items.map((item) => ({ ...item, id: item._id.toString() })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

router.get(
  '/templates',
  protect,
  requirePermission(PERMISSIONS.NOTIFICATIONS_MANAGE),
  asyncHandler(async (req, res) => {
    const events = Object.keys(EVENT_TEMPLATES);
    const overrides = await Setting.find({ key: { $regex: /^notification\.template\./ } }).lean();
    const overrideMap = new Map(overrides.map((item) => [item.key, item.value]));
    return ok(res, {
      templates: events.map((event) => ({
        event,
        defaultSubject: EVENT_TEMPLATES[event].subject,
        defaultBody: EVENT_TEMPLATES[event].body,
        subject: overrideMap.get(`notification.template.${event}`)?.subject || EVENT_TEMPLATES[event].subject,
        body: overrideMap.get(`notification.template.${event}`)?.body || EVENT_TEMPLATES[event].body,
        overridden: overrideMap.has(`notification.template.${event}`),
      })),
      placeholders: ['name', 'bookTitle', 'dueDate', 'fine', 'amount', 'reference', 'outstanding', 'deadline', 'copyCode', 'reason', 'fineMessage'],
    });
  })
);

router.put(
  '/templates/:event',
  protect,
  requirePermission(PERMISSIONS.NOTIFICATIONS_MANAGE),
  asyncHandler(async (req, res) => {
    const { event } = req.params;
    if (!EVENT_TEMPLATES[event]) return notFound(res, 'Unknown notification event');
    const { subject, body } = req.body;
    if (!subject && !body) return badRequest(res, 'Provide a subject and/or body');

    await Setting.findOneAndUpdate(
      { key: `notification.template.${event}` },
      {
        value: {
          subject: subject || EVENT_TEMPLATES[event].subject,
          body: body || EVENT_TEMPLATES[event].body,
        },
        label: `Notification template: ${event}`,
        category: 'notifications',
        updatedBy: req.user._id,
      },
      { upsert: true, new: true }
    );

    await logActivity({
      actor: req.user,
      action: 'NOTIFICATION_TEMPLATE_UPDATED',
      entity: 'Setting',
      details: { event },
    });

    return ok(res, await getTemplate(event), 'Template saved');
  })
);

router.post(
  '/reminders/run',
  protect,
  requirePermission(PERMISSIONS.NOTIFICATIONS_MANAGE),
  asyncHandler(async (req, res) => {
    const result = await sendDueReminders();
    await logActivity({
      actor: req.user,
      action: 'NOTIFICATION_REMINDERS_RUN',
      entity: 'Notification',
      details: result,
    });
    return ok(res, result, result.skipped ? result.reason : `Reminders processed: ${result.sent} sent`);
  })
);

router.post(
  '/test',
  protect,
  requirePermission(PERMISSIONS.NOTIFICATIONS_MANAGE),
  asyncHandler(async (req, res) => {
    const requested = Array.isArray(req.body.channels) && req.body.channels.length
      ? req.body.channels
      : ['email', 'sms', 'whatsapp'];

    const notification = await sendNotification({
      user: req.user,
      title: 'ABSU Smart Library notification test',
      message: 'This is a test notification from the ABSU Smart Library.',
      type: 'info',
      event: 'test',
      data: { name: `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim() },
      channels: requested,
    });

    const deliveries = notification
      ? await NotificationDelivery.find({ notification: notification._id }).lean()
      : [];

    return ok(
      res,
      {
        integration: getNotificationIntegrationStatus(),
        deliveries: deliveries.map((item) => ({
          channel: item.channel,
          status: item.status,
          error: item.error,
        })),
      },
      'Test notification dispatched'
    );
  })
);

export default router;
