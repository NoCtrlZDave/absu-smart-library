import crypto from 'crypto';
import User from '../models/User.js';
import Setting from '../models/Setting.js';
import { buildMatricValidator, getPolicy, addDays } from './policies.js';
import {
  computeLevel,
  getCurrentSession,
  parseAdmissionYear,
  parseSessionStart,
} from './academic.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ROWS = 1000;

export const DEFAULT_STUDENT_PASSWORD = 'student123';

export const STUDENT_LEVELS = ['100', '200', '300', '400', '500', '600'];

export const STUDENT_DEPARTMENTS = [
  'Computer Science',
  'Engineering',
  'Medicine',
  'Law',
  'Business',
  'Education',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Social Sciences',
  'Arts & Humanities',
  'Agriculture',
];

const text = (value) => (value === undefined || value === null ? '' : String(value).trim());

const pick = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }
  return '';
};

const normalizeRow = (raw) => {
  const firstName = text(pick(raw, ['firstName', 'First Name', 'first_name', 'firstname']));
  const lastName = text(pick(raw, ['lastName', 'Last Name', 'last_name', 'lastname']));
  const fullName = text(pick(raw, ['fullName', 'Full Name', 'full_name', 'name', 'Name']));
  const nameParts = fullName.split(/\s+/).filter(Boolean);

  return {
    first_name: firstName || nameParts[0] || '',
    last_name: lastName || nameParts.slice(1).join(' ') || '',
    matricNumber: text(
      pick(raw, ['matricNumber', 'Matriculation Number', 'Matric Number', 'matric', 'Matric', 'matric_no'])
    ).toUpperCase(),
    email: text(pick(raw, ['email', 'Email', 'Email Address', 'emailAddress'])).toLowerCase(),
    department: text(pick(raw, ['department', 'Department'])),
    faculty: text(pick(raw, ['faculty', 'Faculty'])),
    programme: text(pick(raw, ['programme', 'Programme', 'program', 'Program', 'Course'])),
    level: text(pick(raw, ['level', 'Level', 'Level of Study'])),
    phone: text(pick(raw, ['phone', 'Phone', 'Phone Number', 'phoneNumber'])),
  };
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const createActivation = async () => {
  const token = crypto.randomBytes(32).toString('hex');
  const days = await getPolicy('student.activationDays');
  const expiresAt = days ? addDays(new Date(), days) : null;
  return { token, tokenHash: hashToken(token), expiresAt };
};

export const hashActivationToken = hashToken;

const getDepartmentValues = async () => {
  const setting = await Setting.findOne({ key: 'student.departmentOptions' }).lean();
  if (!setting?.value) return null;
  const values = Array.isArray(setting.value)
    ? setting.value
    : String(setting.value).split(',');
  return values.map((item) => String(item).trim()).filter(Boolean);
};

const getDepartmentOptions = async () => {
  const values = await getDepartmentValues();
  return values ? values.map((item) => item.toLowerCase()) : null;
};

export const getStudentOptions = async () => {
  const [levels, departments, academicSession] = await Promise.all([
    getPolicy('student.levelOptions'),
    getDepartmentValues(),
    getCurrentSession(),
  ]);

  return {
    levels: levels?.length ? levels : STUDENT_LEVELS,
    departments: departments?.length ? departments : STUDENT_DEPARTMENTS,
    academicSession,
    defaultPassword: DEFAULT_STUDENT_PASSWORD,
  };
};

export const createStudentAccount = async (row, session) => {
  const academicSession = session || (await getCurrentSession());
  const level = computeLevel(
    parseAdmissionYear(row.matricNumber),
    parseSessionStart(academicSession)
  );

  const user = await User.create({
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    password: DEFAULT_STUDENT_PASSWORD,
    role: 'student',
    matricNumber: String(row.matricNumber).toUpperCase(),
    department: row.department || null,
    faculty: row.faculty || null,
    programme: row.programme || null,
    level: level ? String(level) : row.level || null,
    phone: row.phone || null,
    isActive: true,
    mustChangePassword: true,
  });

  return user;
};

export const validateStudentRows = async (rows, { skipDatabaseDuplicates = false } = {}) => {
  if (!Array.isArray(rows) || !rows.length) {
    return { error: 'rows must be a non-empty array' };
  }
  if (rows.length > MAX_ROWS) {
    return { error: `A maximum of ${MAX_ROWS} rows can be imported at once` };
  }

  const [matricPattern, levelOptions, departmentOptions, currentSession] = await Promise.all([
    getPolicy('student.matricPattern'),
    getPolicy('student.levelOptions'),
    getDepartmentOptions(),
    getCurrentSession(),
  ]);
  const matricValidator = buildMatricValidator(matricPattern);
  const normalizedLevels = (levelOptions || []).map((level) => String(level).toLowerCase());
  const sessionStart = parseSessionStart(currentSession);

  const normalized = rows.map((row, index) => ({
    rowNumber: index + 1,
    ...normalizeRow(row || {}),
  }));

  const existingUsers = skipDatabaseDuplicates
    ? []
    : await User.find({
        $or: [
          { matricNumber: { $in: normalized.map((row) => row.matricNumber).filter(Boolean) } },
          { email: { $in: normalized.map((row) => row.email).filter(Boolean) } },
        ],
      })
        .select('matricNumber email')
        .lean();

  const existingMatrics = new Set(existingUsers.map((user) => user.matricNumber).filter(Boolean));
  const existingEmails = new Set(existingUsers.map((user) => user.email).filter(Boolean));

  const seenMatrics = new Map();
  const seenEmails = new Map();

  const validated = normalized.map((row) => {
    const errors = [];
    const computedLevel = computeLevel(parseAdmissionYear(row.matricNumber), sessionStart);

    if (!row.first_name) errors.push('First name is required');
    if (!row.last_name) errors.push('Last name is required');
    if (!row.matricNumber) errors.push('Matriculation number is required');
    else if (!matricValidator.test(row.matricNumber)) errors.push('Invalid matriculation number format');

    if (!row.email) errors.push('Email is required');
    else if (!EMAIL_PATTERN.test(row.email)) errors.push('Invalid email address');

    if (row.level && normalizedLevels.length && !normalizedLevels.includes(row.level.toLowerCase())) {
      errors.push(`Level must be one of: ${levelOptions.join(', ')}`);
    }

    if (departmentOptions && row.department && !departmentOptions.includes(row.department.toLowerCase())) {
      errors.push('Department is not recognised');
    }

    if (row.matricNumber) {
      if (seenMatrics.has(row.matricNumber)) {
        errors.push(`Duplicate matriculation number in file (row ${seenMatrics.get(row.matricNumber)})`);
      } else {
        seenMatrics.set(row.matricNumber, row.rowNumber);
      }
      if (existingMatrics.has(row.matricNumber)) errors.push('Matriculation number already exists');
    }

    if (row.email) {
      if (seenEmails.has(row.email)) {
        errors.push(`Duplicate email in file (row ${seenEmails.get(row.email)})`);
      } else {
        seenEmails.set(row.email, row.rowNumber);
      }
      if (existingEmails.has(row.email)) errors.push('Email already exists');
    }

    let status = 'ready';
    if (errors.some((error) => error.includes('already exists') || error.includes('Duplicate'))) status = 'duplicate';
    if (errors.some((error) => !error.includes('already exists') && !error.includes('Duplicate'))) status = 'invalid';

    return {
      ...row,
      level: computedLevel ? String(computedLevel) : row.level,
      computedLevel: computedLevel ? String(computedLevel) : null,
      academicSession: currentSession,
      status,
      errors,
    };
  });

  return { rows: validated };
};

export const importStudentRows = async (rows, actor) => {
  const validation = await validateStudentRows(rows);
  if (validation.error) return validation;

  const results = [];
  let createdCount = 0;
  let failedCount = 0;
  const session = await getCurrentSession();

  for (const row of validation.rows) {
    if (row.status !== 'ready') {
      results.push(row);
      continue;
    }

    try {
      const user = await createStudentAccount(row, session);
      createdCount += 1;
      results.push({
        ...row,
        status: 'created',
        userId: String(user._id),
        temporaryPassword: DEFAULT_STUDENT_PASSWORD,
      });
    } catch (err) {
      failedCount += 1;
      const message =
        err.code === 11000
          ? 'A student with this matriculation number or email already exists'
          : err.message || 'Could not create account';
      results.push({ ...row, status: 'failed', errors: [...row.errors, message] });
    }
  }

  return {
    rows: results,
    summary: {
      total: results.length,
      created: createdCount,
      failed: failedCount,
      invalid: results.filter((row) => row.status === 'invalid').length,
      duplicate: results.filter((row) => row.status === 'duplicate').length,
      ready: results.filter((row) => row.status === 'ready').length,
    },
    temporaryPassword: DEFAULT_STUDENT_PASSWORD,
    actor,
  };
};

export default {
  validateStudentRows,
  importStudentRows,
  createStudentAccount,
  getStudentOptions,
  createActivation,
  hashActivationToken,
};
