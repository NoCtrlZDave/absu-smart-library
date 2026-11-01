import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import app from './app.js';
import { sendDueReminders } from './services/notifications.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const REMINDER_INTERVAL_HOURS = Math.max(1, Number(process.env.REMINDER_INTERVAL_HOURS) || 6);

const runReminders = async () => {
  try {
    const result = await sendDueReminders();
    if (!result.skipped) console.log(`Library reminders processed: ${result.sent}/${result.scanned}`);
  } catch (err) {
    console.error('Reminder job failed:', err.message);
  }
};

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`ABSU Smart Library API running on http://localhost:${PORT}`);
  });

  if (String(process.env.ENABLE_REMINDER_JOB || 'true') !== 'false') {
    const timer = setInterval(runReminders, REMINDER_INTERVAL_HOURS * 60 * 60 * 1000);
    timer.unref();
  }
};

start();