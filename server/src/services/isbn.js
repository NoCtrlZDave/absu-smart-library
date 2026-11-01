export const normalizeIsbn = (value) =>
  String(value || '')
    .replace(/[^0-9Xx]/g, '')
    .toUpperCase();

export const isValidIsbn10 = (value) => {
  const digits = normalizeIsbn(value);
  if (digits.length !== 10) return false;
  let sum = 0;
  for (let i = 0; i < 10; i += 1) {
    const char = digits[i];
    if (!/[0-9X]/.test(char)) return false;
    const digit = char === 'X' ? 10 : Number(char);
    if (char === 'X' && i !== 9) return false;
    sum += digit * (10 - i);
  }
  return sum % 11 === 0;
};

export const isValidIsbn13 = (value) => {
  const digits = normalizeIsbn(value);
  if (digits.length !== 13 || !/^\d{13}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i += 1) {
    sum += Number(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return sum % 10 === 0;
};

export const isValidIsbn = (value) => {
  const digits = normalizeIsbn(value);
  if (!digits) return { valid: false, normalized: '', reason: 'ISBN is empty' };
  if (digits.length === 10) {
    return {
      valid: isValidIsbn10(digits),
      normalized: digits,
      format: 'ISBN-10',
      reason: isValidIsbn10(digits) ? null : 'Invalid ISBN-10 checksum',
    };
  }
  if (digits.length === 13) {
    return {
      valid: isValidIsbn13(digits),
      normalized: digits,
      format: 'ISBN-13',
      reason: isValidIsbn13(digits) ? null : 'Invalid ISBN-13 checksum',
    };
  }
  return {
    valid: false,
    normalized: digits,
    format: null,
    reason: 'ISBN must contain 10 or 13 digits',
  };
};

export const isbn10To13 = (value) => {
  const digits = normalizeIsbn(value);
  if (digits.length !== 10) return null;
  const core = `978${digits.slice(0, 9)}`;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) sum += Number(core[i]) * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return `${core}${check}`;
};

export default { normalizeIsbn, isValidIsbn, isValidIsbn10, isValidIsbn13, isbn10To13 };
