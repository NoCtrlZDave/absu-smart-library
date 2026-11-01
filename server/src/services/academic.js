import Setting from '../models/Setting.js';

export const ACADEMIC_SESSION_KEY = 'academic.currentSession';

const MIN_LEVEL = 100;
const MAX_LEVEL = 600;
const MIN_YEAR = 1900;
const MAX_YEAR = 2200;

export const getDefaultSession = (date = new Date()) => {
  const year = date.getFullYear();
  const start = date.getMonth() + 1 >= 8 ? year : year - 1;
  return `${start}/${start + 1}`;
};

export const normalizeSession = (value) => {
  const match = String(value ?? '').trim().match(/^(\d{4})(?:\s*\/\s*(\d{4}))?$/);
  if (!match) return null;
  const start = Number(match[1]);
  if (!Number.isFinite(start) || start < MIN_YEAR || start > MAX_YEAR) return null;
  if (match[2] && Number(match[2]) !== start + 1) return null;
  return `${start}/${start + 1}`;
};

export const parseSessionStart = (value) => {
  const normalized = normalizeSession(value);
  return normalized ? Number(normalized.slice(0, 4)) : null;
};

export const parseAdmissionYear = (matricNumber) => {
  const match = String(matricNumber ?? '').trim().match(/^(\d{4})\//);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) && year >= MIN_YEAR && year <= MAX_YEAR ? year : null;
};

export const computeLevel = (admissionYear, sessionStart) => {
  if (!admissionYear || !sessionStart) return null;
  const years = sessionStart - admissionYear;
  if (years < 0) return null;
  const level = Math.max(MIN_LEVEL, years * 100);
  return Math.min(MAX_LEVEL, level);
};

export const getCurrentSession = async () => {
  const setting = await Setting.findOne({ key: ACADEMIC_SESSION_KEY }).lean();
  return normalizeSession(setting?.value) || getDefaultSession();
};

export const withAcademicInfo = (user, session) => {
  if (!user) return user;
  const academicSession = normalizeSession(session) || getDefaultSession();
  const admissionYear = parseAdmissionYear(user.matricNumber);
  const level = computeLevel(admissionYear, parseSessionStart(academicSession));

  return {
    ...user,
    admissionYear,
    academicSession,
    academicLevel: level ? String(level) : null,
    level: level ? String(level) : user.level || null,
  };
};

export const presentUser = (user, session) => {
  if (!user) return user;
  const safe =
    typeof user.toSafeJSON === 'function'
      ? user.toSafeJSON()
      : { ...user, id: user.id || (user._id ? String(user._id) : undefined) };
  return withAcademicInfo(safe, session);
};

export default {
  ACADEMIC_SESSION_KEY,
  getDefaultSession,
  normalizeSession,
  parseSessionStart,
  parseAdmissionYear,
  computeLevel,
  getCurrentSession,
  withAcademicInfo,
  presentUser,
};
