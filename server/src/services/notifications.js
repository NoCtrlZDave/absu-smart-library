import Notification from '../models/Notification.js';
import NotificationDelivery from '../models/NotificationDelivery.js';
import Setting from '../models/Setting.js';
import Borrowing from '../models/Borrowing.js';
import User from '../models/User.js';
import { getPolicy } from './policies.js';

export const EVENT_TEMPLATES = {
  due_soon: {
    subject: 'Library book due soon',
    body: 'Hello {{name}}, "{{bookTitle}}" is due on {{dueDate}}. Please return or renew it before the due date.',
  },
  due_today: {
    subject: 'Library book due today',
    body: 'Hello {{name}}, "{{bookTitle}}" is due today ({{dueDate}}). Please return or renew it today.',
  },
  overdue: {
    subject: 'Overdue library book',
    body: 'Hello {{name}}, "{{bookTitle}}" is overdue. It was due on {{dueDate}}. A fine of NGN {{fine}} may apply.',
  },
  reservation_requested: {
    subject: 'Reservation request received',
    body: 'Hello {{name}}, your reservation request for "{{bookTitle}}" has been received and is awaiting approval.',
  },
  reservation_approved: {
    subject: 'Reservation approved',
    body: 'Hello {{name}}, your reservation for "{{bookTitle}}" was approved. Collect it by {{deadline}}. Copy: {{copyCode}}.',
  },
  reservation_rejected: {
    subject: 'Reservation rejected',
    body: 'Hello {{name}}, your reservation for "{{bookTitle}}" was rejected. {{reason}}',
  },
  reservation_available: {
    subject: 'Reserved book available',
    body: 'Hello {{name}}, "{{bookTitle}}" is now available for you at the library.',
  },
  renewal_approved: {
    subject: 'Loan renewal approved',
    body: 'Hello {{name}}, your renewal for "{{bookTitle}}" was approved. New due date: {{dueDate}}.',
  },
  renewal_rejected: {
    subject: 'Loan renewal rejected',
    body: 'Hello {{name}}, your renewal request for "{{bookTitle}}" was rejected. {{reason}}',
  },
  book_issued: {
    subject: 'Book issued',
    body: 'Hello {{name}}, "{{bookTitle}}" was issued to you. Please return it by {{dueDate}}.',
  },
  book_returned: {
    subject: 'Book returned',
    body: 'Hello {{name}}, "{{bookTitle}}" has been recorded as returned. {{fineMessage}}',
  },
  fine_notification: {
    subject: 'Library fine notice',
    body: 'Hello {{name}}, an outstanding library fine of NGN {{amount}} is recorded on your account. Reference: {{reference}}.',
  },
  fine_paid: {
    subject: 'Fine payment received',
    body: 'Hello {{name}}, your payment of NGN {{amount}} was received. Reference: {{reference}}. Outstanding balance: NGN {{outstanding}}.',
  },
  fine_waived: {
    subject: 'Fine waived',
    body: 'Hello {{name}}, a fine of NGN {{amount}} was waived on your account. Outstanding balance: NGN {{outstanding}}.',
  },
  test: {
    subject: 'ABSU Smart Library notification test',
    body: 'Hello {{name}}, this is a test notification from the ABSU Smart Library.',
  },
};

const render = (template, data = {}) =>
  String(template || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    const value = data[key];
    return value === undefined || value === null ? '' : String(value);
  });

const fetchWithTimeout = async (url, options, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const channelConfig = () => ({
  email: {
    url: process.env.EMAIL_PROVIDER_URL || null,
    key: process.env.EMAIL_API_KEY || null,
  },
  sms: {
    url: process.env.SMS_PROVIDER_URL || null,
    key: process.env.SMS_API_KEY || null,
    sender: process.env.SMS_SENDER || null,
  },
  whatsapp: {
    url: process.env.WHATSAPP_API_URL || null,
    token: process.env.WHATSAPP_ACCESS_TOKEN || null,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
  },
});

export const getNotificationIntegrationStatus = () => {
  const config = channelConfig();
  return {
    email: { configured: Boolean(config.email.url && config.email.key) },
    sms: { configured: Boolean(config.sms.url && config.sms.key) },
    whatsapp: { configured: Boolean(config.whatsapp.url && config.whatsapp.token) },
    requiredEnvironment: {
      email: ['EMAIL_PROVIDER_URL', 'EMAIL_API_KEY', 'notifications.fromEmail'],
      sms: ['SMS_PROVIDER_URL', 'SMS_API_KEY', 'SMS_SENDER'],
      whatsapp: ['WHATSAPP_API_URL', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'],
    },
  };
};

const deliver = async ({ channel, user, subject, body, notification }) => {
  const config = channelConfig();
  const destination =
    channel === 'email' ? user.email : user.phone ? String(user.phone) : null;

  const record = await NotificationDelivery.create({
    notification: notification?._id || null,
    user: user._id,
    channel,
    destination,
    subject,
    body,
    provider: config[channel]?.url || null,
    status: 'queued',
  });

  if (!destination) {
    record.status = 'failed';
    record.error = `No ${channel === 'email' ? 'email address' : 'phone number'} on file`;
    await record.save();
    return record;
  }

  const missingConfig =
    channel === 'email'
      ? !config.email.url || !config.email.key
      : channel === 'sms'
        ? !config.sms.url || !config.sms.key
        : !config.whatsapp.url || !config.whatsapp.token;

  if (missingConfig) {
    record.status = 'not_configured';
    record.error = `${channel} provider is not configured. Set the required environment variables.`;
    await record.save();
    return record;
  }

  try {
    let response;
    if (channel === 'email') {
      response = await fetchWithTimeout(config.email.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.email.key}`,
        },
        body: JSON.stringify({
          to: destination,
          from: process.env.NOTIFICATIONS_FROM_EMAIL || 'library@absu.edu.ng',
          subject,
          text: body,
          html: `<p>${String(body).replace(/\n/g, '<br/>')}</p>`,
        }),
      });
    } else if (channel === 'sms') {
      response = await fetchWithTimeout(config.sms.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.sms.key}`,
        },
        body: JSON.stringify({
          to: destination,
          sender: process.env.SMS_SENDER || 'ABSULIB',
          message: body,
        }),
      });
    } else {
      response = await fetchWithTimeout(config.whatsapp.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.whatsapp.token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: destination,
          type: 'text',
          text: { body },
        }),
      });
    }

    const payload = await response.json().catch(() => null);
    record.attempts += 1;
    record.status = response.ok ? 'sent' : 'failed';
    record.sentAt = response.ok ? new Date() : null;
    record.providerReference =
      payload?.id || payload?.messageId || payload?.reference || payload?.data?.id || null;
    record.error = response.ok ? null : payload?.message || `Provider responded with HTTP ${response.status}`;
    await record.save();
  } catch (err) {
    record.attempts += 1;
    record.status = 'failed';
    record.error = err.name === 'AbortError' ? 'Provider request timed out' : err.message;
    await record.save();
  }

  return record;
};

export const getTemplate = async (event, fallback = {}) => {
  const base = fallback.subject || fallback.body ? fallback : EVENT_TEMPLATES[event] || {};
  const setting = await Setting.findOne({ key: `notification.template.${event}` }).lean();
  if (setting?.value && typeof setting.value === 'object') {
    return {
      subject: setting.value.subject || base.subject || 'Library notification',
      body: setting.value.body || base.body || '',
    };
  }
  return {
    subject: base.subject || 'Library notification',
    body: base.body || '',
  };
};

export const sendNotification = async ({
  user,
  title,
  message,
  type = 'info',
  event = null,
  data = {},
  channels = [],
  reservation = null,
  borrowing = null,
  book = null,
}) => {
  if (!user) return null;

  let notification = null;
  try {
    notification = await Notification.create({
      user: user._id || user,
      title,
      message,
      type,
      event,
      reservation: reservation || null,
      borrowing: borrowing || null,
      book: book || null,
    });
  } catch (err) {
    console.error('Notification write failed:', err.message);
  }

  if (!event) return notification;

  const template = await getTemplate(event, { subject: title, body: message });
  const subject = render(template.subject, { ...data, name: `${user.first_name || ''} ${user.last_name || ''}`.trim() });
  const body = render(template.body || message, {
    ...data,
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Library user',
  });

  const enabled = await Promise.all([
    getPolicy('notifications.emailEnabled'),
    getPolicy('notifications.smsEnabled'),
    getPolicy('notifications.whatsappEnabled'),
  ]);
  const enabledChannels = ['email', 'sms', 'whatsapp'].filter((channel, index) => enabled[index]);
  const requested = channels.length ? channels : enabledChannels;

  await Promise.allSettled(
    requested.map((channel) =>
      deliver({ channel, user, subject, body, notification })
    )
  );

  return notification;
};

const startOfDay = (date = new Date()) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const sendDueReminders = async () => {
  const enabled = await getPolicy('notifications.remindersEnabled');
  if (!enabled) return { skipped: true, reason: 'Reminders are disabled' };

  const dueSoonDays = await getPolicy('notifications.dueSoonDays');
  const now = new Date();
  const endWindow = new Date(now.getTime() + dueSoonDays * 24 * 60 * 60 * 1000);

  const loans = await Borrowing.find({
    status: 'active',
    dueDate: { $lte: endWindow },
  })
    .limit(500)
    .lean();

  let sent = 0;
  for (const loan of loans) {
    const user = await User.findById(loan.student);
    if (!user) continue;

    const due = new Date(loan.dueDate);
    const isOverdue = due < now;
    const isToday = due.toDateString() === now.toDateString();
    const event = isOverdue ? 'overdue' : isToday ? 'due_today' : 'due_soon';

    const alreadySent = await Notification.findOne({
      user: user._id,
      event,
      borrowing: loan._id,
      createdAt: { $gte: startOfDay() },
    });
    if (alreadySent) continue;

    await sendNotification({
      user,
      title: EVENT_TEMPLATES[event].subject,
      message: render(EVENT_TEMPLATES[event].body, {
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        bookTitle: loan.bookTitle,
        dueDate: due.toLocaleDateString(),
        fine: loan.finesAccrued || 0,
      }),
      type: isOverdue ? 'warning' : 'info',
      event,
      data: {
        bookTitle: loan.bookTitle,
        dueDate: due.toLocaleDateString(),
        fine: loan.finesAccrued || 0,
      },
      borrowing: loan._id,
      book: loan.book,
    });
    sent += 1;
  }

  return { sent, scanned: loans.length };
};

export default { sendNotification, sendDueReminders, getTemplate, getNotificationIntegrationStatus, EVENT_TEMPLATES };
