export const MATRIC_REGEX = /^(?:[A-Za-z]+\/)?(\d{4})\/(\d{6})\/([A-Za-z]+)$/;

export const parseMatricParts = (matric) => {
  const raw = String(matric || '').trim();
  const match = raw.match(MATRIC_REGEX);
  if (!match) return null;
  return {
    admissionYear: Number(match[1]),
    serial: match[2],
    programType: match[3],
  };
};

export const parseAdmissionYear = (matric) => {
  const parts = parseMatricParts(matric);
  return parts ? parts.admissionYear : null;
};

export const parseSessionStartYear = (sessionLabel) => {
  const raw = String(sessionLabel || '').trim();
  const match = raw.match(/^(\d{4})/);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isInteger(year) ? year : null;
};

export const isValidMatric = (matric) => MATRIC_REGEX.test(String(matric || '').trim());

export const calculateLevel = (matric, sessionLabel) => {
  const admissionYear = parseAdmissionYear(matric);
  const sessionYear = parseSessionStartYear(sessionLabel);
  if (admissionYear === null || sessionYear === null) return null;
  const yearsElapsed = sessionYear - admissionYear;
  if (yearsElapsed < 0) return 100;
  return (yearsElapsed + 1) * 100;
};

export const buildSessions = (pivotYear) => {
  const year = Number.isInteger(pivotYear) ? pivotYear : new Date().getFullYear();
  const sessions = [];
  for (let offset = 7; offset >= 0; offset -= 1) {
    const start = year - offset;
    sessions.push({
      id: `sess-${start}`,
      label: `${start}/${start + 1}`,
      startYear: start,
      status: 'upcoming',
    });
  }
  return sessions;
};

export const defaultActiveSession = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return month >= 9 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
};

export const deriveStudentEmail = (matric) => {
  const cleaned = String(matric || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return `${cleaned}@absu.edu.ng`;
};