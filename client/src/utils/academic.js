export const ACADEMIC_SESSION_KEY = 'academic.currentSession';

export const getDefaultAcademicSession = (date = new Date()) => {
  const year = date.getFullYear();
  const start = date.getMonth() + 1 >= 8 ? year : year - 1;
  return `${start}/${start + 1}`;
};

export const normalizeAcademicSession = (value) => {
  const match = String(value ?? '').match(/(\d{4})/);
  if (!match) return null;
  const start = Number(match[1]);
  if (!Number.isFinite(start) || start < 1900 || start > 2200) return null;
  return `${start}/${start + 1}`;
};

export const buildAcademicSessionOptions = ({ span = 8, lookBack = 5 } = {}) => {
  const current = normalizeAcademicSession(getDefaultAcademicSession());
  const currentStart = Number(current.slice(0, 4));
  return Array.from({ length: span }, (_, index) => {
    const start = currentStart - lookBack + index;
    return {
      value: `${start}/${start + 1}`,
      label: `${start}/${start + 1}`,
    };
  });
};

export const parseAdmissionYear = (matricNumber) => {
  const match = String(matricNumber ?? '').trim().match(/^(\d{4})\//);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) && year >= 1900 && year <= 2200 ? year : null;
};

export const computeLevelFromMatric = (matricNumber, session) => {
  const admissionYear = parseAdmissionYear(matricNumber);
  const normalized = normalizeAcademicSession(session);
  if (!admissionYear || !normalized) return null;
  const years = Number(normalized.slice(0, 4)) - admissionYear;
  if (years < 0) return null;
  return Math.min(600, Math.max(100, years * 100));
};

export const formatLevel = (level) => {
  const value = String(level ?? '').trim();
  return value ? `${value} Level` : 'Not set';
};
