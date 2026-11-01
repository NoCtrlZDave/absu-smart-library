import Setting from '../models/Setting.js';

const COUNTER_KEY = 'accession.sequence';

export const generateAccessionNumber = async () => {
  const year = new Date().getFullYear();
  const setting = await Setting.findOne({ key: COUNTER_KEY }).lean();
  let sequence = Number(setting?.value);
  if (!Number.isFinite(sequence) || sequence < 1) sequence = 1;

  const accessionNumber = `ACC-${year}-${String(sequence).padStart(4, '0')}`;
  await Setting.findOneAndUpdate(
    { key: COUNTER_KEY },
    { value: sequence + 1, updatedBy: null },
    { upsert: true, new: true }
  );

  return accessionNumber;
};

export const parseAccessionNumber = (value) => String(value || '').trim().toUpperCase();

export default { generateAccessionNumber, parseAccessionNumber };
