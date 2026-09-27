import dotenv from 'dotenv';
import mongoose from 'mongoose';

import User from '../models/User.js';
import Book from '../models/Book.js';
import StructureNode from '../models/StructureNode.js';
import InventoryLog from '../models/InventoryLog.js';
import AuditLog from '../models/AuditLog.js';
import Setting from '../models/Setting.js';

import { books as clientBooks } from '../../../client/src/data/books.js';
import TOLEDO_BOOK from './toledo.js';

dotenv.config();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/absu_smart_library';

const convertClientBook = (b) => ({
  title: b.title,
  authors: b.author.split(',').map((a) => a.trim()),
  isbn: b.isbn,
  publisher: b.publisher,
  placeOfPublication: null,
  year: b.year,
  category: b.category,
  department: null,
  description: b.description,
  subjects: b.subjects || [],
  physicalDescription: null,
  format: null,
  location: b.location || { library: 'Main Library' },
  copies: (b.copies || []).map((c) => ({
    code: c.id || c.code,
    status: c.status,
    borrower: c.borrower || null,
    dueDate: c.dueDate || null,
    reservedBy: c.reservedBy || null,
    location: { library: 'Main Library' },
    locationString: c.location || null,
  })),
});

const convertToledo = (t) => ({ ...t });

const CALL_NUM_PREFIX = {
  'Computer Science': 'QA76',
  Engineering: 'T',
  Medicine: 'R',
  Law: 'K',
  Business: 'HF',
  Education: 'L',
  Physics: 'QC',
  Chemistry: 'QD',
  Mathematics: 'QA',
  'Social Sciences': 'H',
  'Arts & Humanities': 'N',
  Agriculture: 'S',
};

const enrichCopies = (docs) => {
  let acc = 1000;
  docs.forEach((b) => {
    (b.copies || []).forEach((c) => {
      if (!c.callNumber) {
        const prefix = CALL_NUM_PREFIX[b.category] || 'Z';
        const cutter = `${String((b.title || 'X')[0]).toUpperCase()}${b.year ? b.year % 100 : 0}`;
        c.callNumber = `${prefix}.${cutter}`;
      }
      if (!c.accessionNumber) {
        acc += 1;
        c.accessionNumber = `ACC-${acc}`;
      }
    });
  });
  return docs;
};

const seedUsers = async () => {
  await User.deleteMany({});
  const admin = await User.create({
    first_name: 'Chinwe',
    last_name: 'Okafor',
    email: 'admin@absu.edu.ng',
    password: 'admin123',
    role: 'admin',
    phone: '08012345678',
  });
  const librarian = await User.create({
    first_name: 'David',
    last_name: 'Nwosu',
    email: 'librarian@absu.edu.ng',
    password: 'lib123',
    role: 'librarian',
    phone: '08087654321',
  });

  return { admin, librarian };
};

const STRUCTURE = {
  sections: [
    { name: 'Computer Science', pillars: [10] },
    { name: 'Engineering', pillars: [12, 13] },
    { name: 'Medicine', pillars: [9] },
    { name: 'Law', pillars: [] },
    { name: 'Business', pillars: [4, 5] },
    { name: 'Education', pillars: [7] },
    { name: 'Physics', pillars: [10] },
    { name: 'Chemistry', pillars: [11] },
    { name: 'Mathematics', pillars: [9] },
    { name: 'Social Sciences', pillars: [2, 5] },
    { name: 'Arts & Humanities', pillars: [7, 1] },
    { name: 'Agriculture', pillars: [11] },
  ],
};

const seedStructure = async () => {
  await StructureNode.deleteMany({});
  const library = await StructureNode.create({ type: 'library', name: 'ABSU Main Library', code: 'MAIN' });
  const floor1 = await StructureNode.create({ type: 'floor', name: 'Floor 1', code: 'F01', parent: library._id, pillars: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13] });

  const sectionNodes = {};
  for (const section of STRUCTURE.sections) {
    const sec = await StructureNode.create({
      type: 'section',
      name: section.name,
      code: section.name.slice(0, 3).toUpperCase(),
      parent: floor1._id,
      pillars: section.pillars,
    });
    sectionNodes[section.name] = sec;
    for (let r = 1; r <= 2; r += 1) {
      const rack = await StructureNode.create({
        type: 'rack',
        name: `Rack ${sec.code}${r}`,
        code: `R${r}`,
        parent: sec._id,
        pillars: section.pillars,
      });
      for (let s = 1; s <= 3; s += 1) {
        await StructureNode.create({
          type: 'shelf',
          name: `Shelf ${s}`,
          code: `S${s}`,
          parent: rack._id,
          capacity: 50,
          pillars: section.pillars,
        });
      }
    }
  }
  return { library, sections: sectionNodes };
};

const seedBooks = async () => {
  await Book.deleteMany({});

  const docs = [];
  clientBooks.forEach((b) => docs.push(convertClientBook(b)));
  docs.push(convertToledo(TOLEDO_BOOK));

  enrichCopies(docs);

  const books = await Book.create(docs);

  return books;
};

const seedMisc = async (users) => {
  await InventoryLog.deleteMany({});
  await AuditLog.deleteMany({});
  await Setting.deleteMany({});

  await InventoryLog.create([
    { bookTitle: 'Verified shelf sample', copyCode: 'VER-001', type: 'verified', status: 'resolved', expectedLocation: 'Floor 3, CS, Rack 1, Shelf 1' },
    { bookTitle: 'Missing sample', copyCode: 'MIS-001', type: 'missing', status: 'open', expectedLocation: 'Floor 2, Law, Rack 2, Shelf 2' },
    { bookTitle: 'Misplaced sample', copyCode: 'MISP-001', type: 'misplaced', status: 'open', expectedLocation: 'Floor 3, CS, Rack 1, Shelf 1', detectedLocation: 'Floor 2, Engineering, Rack 3, Shelf 2' },
  ]);

  await Setting.create([
    { key: 'library.name', label: 'Library Name', value: 'ABSU Main Library', category: 'library' },
  ]);

  await AuditLog.create({
    actor: users.admin._id,
    actorName: 'Chinwe Okafor',
    role: 'admin',
    action: 'SYSTEM_SEEDED',
    entity: 'System',
    details: { command: 'npm run seed' },
  });
};

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Seeding users...');
    const users = await seedUsers();
    console.log('Seeding library structure...');
    await seedStructure();
    console.log('Seeding catalogue...');
    await seedBooks();

    console.log('Seeding complete.');
    console.log('------------------------------------');
    console.log('Admin account:    admin@absu.edu.ng / admin123');
    console.log('Librarian account: librarian@absu.edu.ng / lib123');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();