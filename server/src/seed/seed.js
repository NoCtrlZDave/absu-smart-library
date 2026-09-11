import dotenv from 'dotenv';
import mongoose from 'mongoose';

import User from '../models/User.js';
import Book from '../models/Book.js';
import StructureNode from '../models/StructureNode.js';
import Borrowing from '../models/Borrowing.js';
import Reservation from '../models/Reservation.js';
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
  const students = await User.create([
    {
      first_name: 'Adaeze', last_name: 'Uche',
      email: 'student@absu.edu.ng', password: 'student123', role: 'student',
      matric_number: '2021/131178/regular', department: 'Computer Science', level: '400', phone: '08011223344',
      mustChangePassword: true,
    },
    {
      first_name: 'Emeka', last_name: 'Okonkwo',
      email: 'emeka@absu.edu.ng', password: 'student123', role: 'student',
      matric_number: '2022/134001/regular', department: 'Engineering', level: '300', phone: '08099887766',
      mustChangePassword: true,
    },
    {
      first_name: 'Amina', last_name: 'Yusuf',
      email: 'amina@absu.edu.ng', password: 'student123', role: 'student',
      matric_number: '2021/131450/regular', department: 'Medicine', level: '400', phone: '08055443322',
      mustChangePassword: true,
    },
  ]);

  const pendingStaff = await User.create({
    first_name: 'Dr. Kelechi',
    last_name: 'Eze',
    email: 'staff.pending@absu.edu.ng',
    password: 'staff123',
    role: 'staff',
    staffType: 'teaching',
    verificationStatus: 'pending',
    isActive: true,
    title: 'Dr.',
    staffNumber: 'ABSU/STAFF/0042',
    department: 'Food Science & Technology',
    faculty: 'College of Physical Sciences',
    phone: '08066778899',
  });

  const verifiedStaff = await User.create({
    first_name: 'Chidi',
    last_name: 'Nnamdi',
    email: 'staff.verified@absu.edu.ng',
    password: 'staff123',
    role: 'staff',
    staffType: 'non-teaching',
    verificationStatus: 'verified',
    isActive: true,
    department: 'Library Administration',
    phone: '08012344321',
  });

  return { admin, librarian, students, pendingStaff, verifiedStaff };
};

const seedStructure = async () => {
  await StructureNode.deleteMany({});
  const library = await StructureNode.create({ type: 'library', name: 'ABSU Main Library', code: 'MAIN' });
  const floor1 = await StructureNode.create({ type: 'floor', name: 'Floor 1', code: 'F01', parent: library._id });
  const floor2 = await StructureNode.create({ type: 'floor', name: 'Floor 2', code: 'F02', parent: library._id });
  const floor3 = await StructureNode.create({ type: 'floor', name: 'Floor 3', code: 'F03', parent: library._id });
  const floor4 = await StructureNode.create({ type: 'floor', name: 'Floor 4', code: 'F04', parent: library._id });
  const floor5 = await StructureNode.create({ type: 'floor', name: 'Floor 5', code: 'F05', parent: library._id });

  const sections = [
    ['Business', floor1._id], ['Education', floor1._id], ['Social Sciences', floor1._id],
    ['Engineering', floor2._id], ['Law', floor2._id], ['Arts & Humanities', floor2._id],
    ['Computer Science', floor3._id], ['Medicine', floor4._id], ['Chemistry', floor5._id],
    ['Physics', floor5._id], ['Mathematics', floor5._id], ['Agriculture', floor5._id],
  ];

  const sectionNodes = {};
  for (const [name, parent] of sections) {
    const sec = await StructureNode.create({ type: 'section', name, code: name.slice(0, 3).toUpperCase(), parent });
    sectionNodes[name] = sec;
    for (let r = 1; r <= 3; r += 1) {
      const rack = await StructureNode.create({ type: 'rack', name: `Rack ${name.slice(0, 2).toUpperCase()}${r}`, code: `R${r}`, parent: sec._id });
      for (let s = 1; s <= 3; s += 1) {
        await StructureNode.create({ type: 'shelf', name: `Shelf ${s}`, code: `S${s}`, parent: rack._id, capacity: 50 });
      }
    }
  }
  return { library, sections: sectionNodes };
};

const seedBooks = async (users) => {
  await Book.deleteMany({});

  const docs = [];
  clientBooks.forEach((b) => docs.push(convertClientBook(b)));
  docs.push(convertToledo(TOLEDO_BOOK));

  enrichCopies(docs);

  const books = await Book.create(docs);

  // Create one sample borrowing + reservation so dashboards are not empty
  const [activeBook] = books;
  const borrowedCopy = (activeBook.copies || []).find((c) => c.status !== 'available') || activeBook.copies[0];
  const student = users.students[0];

  const borrow = await Borrowing.create({
    student: student._id,
    book: activeBook._id,
    bookTitle: activeBook.title,
    copyCode: borrowedCopy?.code,
    borrowDate: new Date(Date.now() - 5 * 86400000),
    dueDate: new Date(Date.now() + 9 * 86400000),
  });

  if (borrowedCopy) {
    await Book.updateOne(
      { _id: activeBook._id, 'copies.code': borrowedCopy.code },
      { $set: { 'copies.$.status': 'borrowed', 'copies.$.borrower': `${student.first_name} ${student.last_name}`, 'copies.$.dueDate': borrow.dueDate.toISOString().slice(0, 10) } }
    );
  }

  await Reservation.create({
    student: users.students[1]._id,
    book: books[1]._id,
    bookTitle: books[1].title,
    status: 'pending',
  });

  return books;
};

const seedMisc = async (users) => {
  await Borrowing.deleteMany({});
  await Reservation.deleteMany({});
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
    { key: 'library.loan_days', label: 'Default Loan Days', value: 14, category: 'circulation' },
    { key: 'library.max_reserve_days', label: 'Reservation Hold Days', value: 3, category: 'circulation' },
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
    console.log('Seeding circulation/misc data...');
    await seedMisc(users);
    console.log('Seeding catalogue...');
    await seedBooks(users);

    console.log('Seeding complete.');
    console.log('------------------------------------');
    console.log('Admin account:    admin@absu.edu.ng / admin123');
    console.log('Librarian account: librarian@absu.edu.ng / lib123');
    console.log('Student account:  student@absu.edu.ng / student123 (matric 2021/131178/regular, change on first login)');
    console.log('Staff pending:     staff.pending@absu.edu.ng / staff123 (verify under Admin -> Staff Verification)');
    console.log('Staff verified:    staff.verified@absu.edu.ng / staff123');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

seed();