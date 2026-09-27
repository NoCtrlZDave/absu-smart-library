import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const locationData = JSON.parse(
  readFileSync(path.join(__dirname, '../data/locationData.json'), 'utf8')
);

const categoryData = JSON.parse(
  readFileSync(path.join(__dirname, '../data/categoryMap.json'), 'utf8')
);

const NORMALIZE_DASH = /[–—]/g;
const MULTI_SPACE = /\s+/g;

const normalizeKey = (value) =>
  String(value || '').replace(NORMALIZE_DASH, '-').replace(MULTI_SPACE, ' ').trim().toUpperCase();

const runtimeMedia = new Map();

export const applyLibraryMedia = (docs = []) => {
  runtimeMedia.clear();
  docs.forEach((d) => {
    if (!d || !d.key) return;
    runtimeMedia.set(d.key, { image: d.image || '', caption: d.caption || null });
  });
};

const cloneBaseMedia = () => {
  const base = locationData.media || {};
  const clone = {
    entrance: { image: '', caption: 'ABSU Library main entrance' },
    floors: {
      '1': { image: '', caption: 'First Floor - main book hall' },
      '2': { image: '', caption: 'Second Floor - projects and records' },
    },
    pillars: {},
    subjects: {},
  };
  if (base.entrance) clone.entrance = { ...clone.entrance, ...base.entrance };
  Object.entries(base.floors || {}).forEach(([k, v]) => {
    clone.floors[k] = { ...(clone.floors[k] || {}), ...v };
  });
  Object.entries(base.pillars || {}).forEach(([k, v]) => {
    clone.pillars[k] = { ...v };
  });
  Object.entries(base.subjects || {}).forEach(([k, v]) => {
    clone.subjects[normalizeKey(k)] = { ...v };
  });
  return clone;
};

const resolveMedia = () => {
  const media = cloneBaseMedia();
  runtimeMedia.forEach((val, key) => {
    if (key === 'entrance') {
      media.entrance = { ...media.entrance, ...val };
    } else if (key.startsWith('floor:')) {
      const n = key.slice(6);
      media.floors[n] = { ...(media.floors[n] || {}), ...val };
    } else if (key.startsWith('pillar:')) {
      const n = key.slice(7);
      media.pillars[n] = { ...(media.pillars[n] || {}), ...val };
    } else if (key.startsWith('subject:')) {
      const name = normalizeKey(key.slice(8));
      media.subjects[name] = { ...(media.subjects[name] || {}), ...val };
    }
  });
  return media;
};

export const parseCallNumber = (callNumber) => {
  if (!callNumber || typeof callNumber !== 'string') return { prefix: null, number: null };
  const match = String(callNumber).trim().match(/^([A-Za-z]+)\s*(\d+)?/);
  if (!match) return { prefix: null, number: null };
  return { prefix: match[1].toUpperCase(), number: match[2] ? parseInt(match[2], 10) : null };
};

const RANGE_PATTERN = /^[A-Z]+\s*-\s*[A-Z]+$/;

const entries = [];
const exactIndex = new Map();

for (const pillarNumber of Object.keys(locationData.library_map)) {
  const pillar = locationData.library_map[pillarNumber];
  (pillar.subjects || []).forEach((subject) => {
    const entry = {
      pillar: pillarNumber,
      floor: pillar.floor || 1,
      prefixRaw: subject.prefix,
      prefix: normalizeKey(subject.prefix),
      subject: subject.subject,
      arrow: subject.arrow || null,
      notes: subject.notes || null,
    };
    entries.push(entry);
    if (!exactIndex.has(entry.prefix)) exactIndex.set(entry.prefix, []);
    exactIndex.get(entry.prefix).push(entry);
  });
}

const rangeEntries = entries.filter((e) => RANGE_PATTERN.test(e.prefix));

const pickBest = (list) =>
  [...list].sort((a, b) => {
    if (Boolean(a.arrow) !== Boolean(b.arrow)) return a.arrow ? -1 : 1;
    return Number(a.pillar) - Number(b.pillar);
  })[0] || null;

export const unmappedResult = () => ({
  mapped: false,
  floor: null,
  pillar: null,
  prefix: null,
  subject: null,
  arrow: null,
  notes: null,
  text: 'Location not mapped. Please ask a librarian for assistance.',
});

const arrowLineFor = (entry) => {
  if (!entry || !entry.arrow) return '';
  return entry.arrow === 'Left and Right'
    ? 'The books are on the Left and Right sides.'
    : `The books are on the ${entry.arrow} side.`;
};

const sideTextFor = (entry) => {
  if (!entry || !entry.arrow) return 'The books are shelved at this pillar.';
  if (entry.arrow === 'Left and Right') return 'The books are shelved on both the left and right sides of the pillar.';
  return `The books are on the ${entry.arrow.toLowerCase()} side of the pillar.`;
};

const signTitleFor = (entry) => {
  const subject = String(entry.subject || '').trim();
  if (!subject) return entry.prefix;
  return normalizeKey(entry.prefix) === normalizeKey(subject) ? subject : `${entry.prefix} - ${subject}`;
};

const buildGuideSteps = (entry) => {
  if (!entry) return [];
  const media = resolveMedia();
  const floorNo = Number(entry.floor || 1);
  const pillar = String(entry.pillar || '');
  const pillarMedia = (media.pillars && media.pillars[pillar]) || {};
  const floorMedia = (media.floors && media.floors[String(floorNo)]) || {};
  const steps = [];

  steps.push({
    kind: 'library',
    title: 'Main Library',
    text: 'Go to the ABSU library main entrance and pass through the entrance. The library staff will point you in the right direction.',
    image: (media.entrance && media.entrance.image) || '',
    caption: (media.entrance && media.entrance.caption) || 'ABSU Library main library',
  });

  steps.push({
    kind: 'floor',
    title: floorNo === 1 ? 'Floor 1 - the main book hall' : `Floor ${floorNo}`,
    text:
      floorNo === 1
        ? 'The book is on the first floor, where most of the books are shelved. Walk straight into the main book hall.'
        : `The book is on the second floor. Take the stairs or lift to Floor ${floorNo}.`,
    image: floorMedia.image || '',
    caption: floorMedia.caption || `Floor ${floorNo}`,
  });

  if (pillar) {
    steps.push({
      kind: 'pillar',
      pillar,
      prefix: entry.prefix || null,
      subject: entry.subject || null,
      arrow: entry.arrow || null,
      notes: entry.notes || null,
      title: `Pillar ${pillar}`,
      text: [
        `Go to Pillar ${pillar} on Floor ${floorNo}.`,
        `Look for the sign: ${signTitleFor(entry)}.`,
        sideTextFor(entry),
        entry.notes ? `Note: ${entry.notes}.` : '',
      ].filter(Boolean).join(' '),
      image: pillarMedia.image || '',
      caption: pillarMedia.caption || `Pillar ${pillar}`,
    });
  }

  return steps;
};

const buildResult = (entry, signPrefix) => {
  if (!entry) return unmappedResult();
  const arrowLine = arrowLineFor(entry);
  const sign = `${signPrefix} - ${entry.subject}`.replace(/\.+$/, '');
  return {
    mapped: true,
    floor: entry.floor,
    pillar: entry.pillar,
    prefix: signPrefix,
    subject: entry.subject,
    arrow: entry.arrow,
    notes: entry.notes || null,
    text: `📍 Location: Floor ${entry.floor}, Pillar ${entry.pillar}. Look for the sign: ${sign}.${arrowLine ? ` ${arrowLine}` : ''}`,
    guide: buildGuideSteps(entry),
  };
};

export const resolvePrefix = (prefix) => {
  const key = normalizeKey(prefix);
  if (!key) return unmappedResult();

  const exactMatches = exactIndex.get(key) || [];
  if (exactMatches.length) {
    return buildResult(pickBest(exactMatches), String(prefix).toUpperCase());
  }

  const rangeMatches = rangeEntries.filter((e) => {
    const [start, end] = e.prefix.split('-').map((p) => p.trim());
    return key >= start && key <= end;
  });
  if (rangeMatches.length) {
    const best = pickBest(rangeMatches);
    return buildResult(best, best.prefixRaw);
  }

  return unmappedResult();
};

export const getPhysicalLocation = (callNumber) => {
  const { prefix, number } = parseCallNumber(callNumber);
  if (!prefix) return unmappedResult();

  if (prefix === 'HF' && number !== null && number >= 3001) {
    const banking = (exactIndex.get('BANKING AND FINANCE') || []).find((e) => e.pillar === '5');
    if (banking) return buildResult(banking, 'HF');
  }

  return resolvePrefix(prefix);
};

export const getLocationByCategory = (category) => {
  const key = normalizeKey(category);
  const mapping = categoryData.categories && categoryData.categories[key];
  if (!mapping) return unmappedResult();

  for (const prefix of Array.isArray(mapping.prefixes) ? mapping.prefixes : []) {
    const result = resolvePrefix(prefix);
    if (result.mapped) {
      const signKey = normalizeKey(result.prefix) === normalizeKey(result.subject)
        ? result.subject
        : `${result.prefix} - ${result.subject}`.replace(/\.+$/, '');
      return {
        ...result,
        text: `📍 Location: Floor ${result.floor}, Pillar ${result.pillar}. Look for the sign: ${signKey}.${arrowLineFor(result) ? ` ${arrowLineFor(result)}` : ''}`,
      };
    }
  }

  return unmappedResult();
};

export const deriveLocationFromCategory = (category, library = 'Main Library') => {
  const guide = getLocationByCategory(category);
  if (!guide || !guide.mapped) return null;
  return {
    library,
    floor: `Floor ${guide.floor || 1}`,
    section: guide.subject || null,
    rack: null,
    shelf: null,
    physicalLocation: guide,
  };
};

export const getPhysicalLocationString = (callNumber) => getPhysicalLocation(callNumber).text;

export const getFullMap = () => ({ ...locationData, media: resolveMedia() });

export const getCategoryMap = () => categoryData;