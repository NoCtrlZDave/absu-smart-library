import Setting from '../models/Setting.js';

export const STAFF_ROLES = [
  'admin',
  'it_librarian',
  'librarian',
  'assistant_librarian',
  'circulation_staff',
];

export const PATRON_ROLES = ['student', 'staff', 'guest'];

export const ALL_ROLES = [...STAFF_ROLES, ...PATRON_ROLES, 'visitor'];

export const CIRCULATION_ROLES = [
  'admin',
  'it_librarian',
  'librarian',
  'assistant_librarian',
  'circulation_staff',
];

export const CATALOGUE_ROLES = ['admin', 'it_librarian', 'librarian', 'assistant_librarian'];

export const POLICY_DEFAULTS = {
  'reservation.collectionDays': 3,
  'reservation.expiryDays': 2,
  'reservation.studentLimit': 3,
  'reservation.staffLimit': 5,
  'reservation.guestLimit': 0,

  'borrowing.loanDays': 14,
  'borrowing.maxActive': 5,
  'borrowing.renewalLimit': 2,
  'borrowing.renewalDays': 7,
  'borrowing.studentLoanDays': 14,
  'borrowing.staffLoanDays': 21,
  'borrowing.guestLoanDays': 7,
  'borrowing.studentMaxActive': 5,
  'borrowing.staffMaxActive': 8,
  'borrowing.guestMaxActive': 1,
  'borrowing.studentRenewals': 2,
  'borrowing.staffRenewals': 3,
  'borrowing.guestRenewals': 0,
  'borrowing.blockRenewalOnReservation': true,
  'borrowing.renewOnlyIfNotOverdue': true,

  'fines.enabled': true,
  'fines.dailyRate': 300,
  'fines.gracePeriodDays': 0,
  'fines.maxFine': 100000,
  'fines.studentRate': 300,
  'fines.staffRate': 300,
  'fines.librarianRate': 300,
  'fines.adminRate': 300,
  'fines.guestRate': 300,

  'notifications.emailEnabled': false,
  'notifications.smsEnabled': false,
  'notifications.whatsappEnabled': false,
  'notifications.remindersEnabled': false,
  'notifications.dueSoonDays': 2,
  'notifications.overdueRepeatDays': 3,
  'notifications.fromEmail': 'library@absu.edu.ng',
  'notifications.smsSender': 'ABSULIB',
  'notifications.whatsappTemplate': 'library_update',

  'student.activationDays': 30,
  'student.matricPattern': '^\\d{4}/\\d{6}/[A-Z]+$',
  'student.staffIdPattern': '^[A-Z]{2,4}/[A-Z]{0,4}/\\d{3,6}$',
  'student.levelOptions': ['100', '200', '300', '400', '500', '600'],

  'academic.currentSession': (() => {
    const now = new Date();
    const start = now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    return `${start}/${start + 1}`;
  })(),
};

const BOOLEAN_KEYS = new Set([
  'fines.enabled',
  'notifications.emailEnabled',
  'notifications.smsEnabled',
  'notifications.whatsappEnabled',
  'notifications.remindersEnabled',
  'borrowing.blockRenewalOnReservation',
  'borrowing.renewOnlyIfNotOverdue',
]);

const toBoolean = (value, fallback) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return fallback;
};

const toPositiveNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const normalizeStringList = (value, fallback) => {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return fallback;
};

export const getPolicy = async (key) => {
  const fallback = POLICY_DEFAULTS[key];
  const setting = await Setting.findOne({ key }).lean();
  const value = setting ? setting.value : fallback;

  if (BOOLEAN_KEYS.has(key)) return toBoolean(value, Boolean(fallback));
  if (key === 'student.matricPattern' || key === 'student.staffIdPattern') {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }
  if (key === 'student.levelOptions') return normalizeStringList(value, fallback);
  if (typeof fallback === 'string') {
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
  }
  return toPositiveNumber(value, fallback);
};

export const getPolicies = async () => {
  const keys = Object.keys(POLICY_DEFAULTS);
  const entries = await Promise.all(keys.map(async (key) => [key, await getPolicy(key)]));
  return Object.fromEntries(entries);
};

export const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
};

export const buildMatricValidator = (pattern) => {
  try {
    return new RegExp(pattern);
  } catch {
    return new RegExp(POLICY_DEFAULTS['student.matricPattern']);
  }
};

export const buildStaffIdValidator = (pattern) => {
  try {
    return new RegExp(pattern);
  } catch {
    return new RegExp(POLICY_DEFAULTS['student.staffIdPattern']);
  }
};

const PATRON_POLICY_ROLES = {
  student: 'student',
  staff: 'staff',
  guest: 'guest',
  visitor: 'guest',
  librarian: 'staff',
  assistant_librarian: 'staff',
  circulation_staff: 'staff',
  it_librarian: 'staff',
  admin: 'staff',
};

export const resolvePatronCategory = (role) => PATRON_POLICY_ROLES[role] || 'student';

export const getRolePolicy = async (role) => {
  const category = resolvePatronCategory(role);
  const label = category === 'staff' ? 'staff' : category === 'guest' ? 'guest' : 'student';
  const [maxActive, loanDays, renewalLimit, fineRate] = await Promise.all([
    getPolicy(`borrowing.${label}MaxActive`),
    getPolicy(`borrowing.${label}LoanDays`),
    getPolicy(`borrowing.${label === 'student' ? 'student' : label}Renewals`),
    getPolicy(`fines.${label}Rate`),
  ]);

  const globalMax = await getPolicy('borrowing.maxActive');
  const globalLoan = await getPolicy('borrowing.loanDays');

  return {
    category,
    maxActive: maxActive || globalMax,
    loanDays: loanDays || globalLoan,
    renewalLimit,
    renewalDays: await getPolicy('borrowing.renewalDays'),
    fineRate,
  };
};

export const POLICY_KEYS = Object.keys(POLICY_DEFAULTS);

export default getPolicy;
