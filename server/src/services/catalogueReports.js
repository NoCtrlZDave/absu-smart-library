import Book from '../models/Book.js';
import Setting from '../models/Setting.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const countStatus = (copies, statuses) =>
  (copies || []).filter((copy) => statuses.includes(copy.status)).length;

const getLibraryName = async () => {
  const setting = await Setting.findOne({ key: 'library.name' }).lean();
  if (setting?.value) return String(setting.value);
  const legacy = await Setting.findOne({ key: 'libraryName' }).lean();
  return legacy?.value ? String(legacy.value) : 'ABSU Library';
};

export const listDepartments = async () => {
  const [bookDepartments, userDepartments, setting] = await Promise.all([
    Book.distinct('department'),
    (await import('../models/User.js')).default.distinct('department', { department: { $ne: null } }),
    Setting.findOne({ key: 'student.departmentOptions' }).lean(),
  ]);

  const configured = Array.isArray(setting?.value)
    ? setting.value
    : typeof setting?.value === 'string'
      ? setting.value.split(',')
      : [];

  const merged = [...bookDepartments, ...userDepartments, ...configured]
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  return Array.from(new Set(merged)).sort((a, b) => a.localeCompare(b));
};

export const buildDepartmentalRows = (books) =>
  books.map((book, index) => {
    const copies = book.copies || [];
    const available = countStatus(copies, ['available', 'verified']);
    const reserved = countStatus(copies, ['reserved']);
    const borrowed = countStatus(copies, ['borrowed']);
    const damaged = countStatus(copies, ['damaged']);
    const missing = countStatus(copies, ['missing']);
    const accessionNumbers = copies.map((copy) => copy.accessionNumber || copy.code).filter(Boolean);
    const callNumbers = copies.map((copy) => copy.callNumber).filter(Boolean);
    const location = book.locationString || copies.find((copy) => copy.locationString)?.locationString || '';

    const remarks = [
      `${available} of ${copies.length} available`,
      borrowed ? `${borrowed} borrowed` : '',
      reserved ? `${reserved} reserved` : '',
      damaged ? `${damaged} damaged` : '',
      missing ? `${missing} missing` : '',
      location ? `Shelf: ${location}` : '',
    ]
      .filter(Boolean)
      .join('; ');

    return {
      sn: index + 1,
      author: (book.authors || []).join(', ') || 'Unknown Author',
      title: book.title,
      subject: (book.subjects || []).join(', ') || book.category || '',
      isbn: book.isbn || '',
      publisher: book.publisher || '',
      publicationYear: book.year || '',
      numberOfCopies: copies.length,
      availableCopies: available,
      classificationNumber: callNumbers[0] || '',
      accessionNumbers: accessionNumbers.join(', '),
      remarks,
    };
  });

export const buildDepartmentalReport = async ({ department, includeAll = false } = {}) => {
  const filter = {};
  if (!includeAll && department) {
    filter.department = new RegExp(`^${escapeRegex(department)}$`, 'i');
  }

  const books = await Book.find(filter).sort({ authors: 1, title: 1 }).lean();
  const rows = buildDepartmentalRows(books);
  const libraryName = await getLibraryName();

  return {
    institution: 'Abia State University',
    libraryName,
    department: includeAll ? 'All Departments' : department,
    generatedAt: new Date().toISOString(),
    totals: {
      titles: books.length,
      copies: books.reduce((sum, book) => sum + (book.copies || []).length, 0),
      availableCopies: books.reduce(
        (sum, book) => sum + countStatus(book.copies || [], ['available', 'verified']),
        0
      ),
    },
    rows,
  };
};

export const buildConsolidatedReport = async () => {
  const departments = await listDepartments();
  const reports = [];
  for (const department of departments) {
    const report = await buildDepartmentalReport({ department });
    if (report.rows.length) reports.push(report);
  }

  const unassignedFilter = { $or: [{ department: null }, { department: '' }, { department: { $exists: false } }] };
  const unassignedBooks = await Book.find(unassignedFilter).lean();
  if (unassignedBooks.length) {
    const libraryName = await getLibraryName();
    reports.push({
      institution: 'Abia State University',
      libraryName,
      department: 'Unassigned',
      generatedAt: new Date().toISOString(),
      totals: {
        titles: unassignedBooks.length,
        copies: unassignedBooks.reduce((sum, book) => sum + (book.copies || []).length, 0),
        availableCopies: unassignedBooks.reduce(
          (sum, book) => sum + countStatus(book.copies || [], ['available', 'verified']),
          0
        ),
      },
      rows: buildDepartmentalRows(unassignedBooks),
    });
  }

  const allBooks = await Book.find().lean();
  return {
    institution: 'Abia State University',
    libraryName: await getLibraryName(),
    department: 'Consolidated (All Departments)',
    generatedAt: new Date().toISOString(),
    totals: {
      titles: allBooks.length,
      copies: allBooks.reduce((sum, book) => sum + (book.copies || []).length, 0),
      availableCopies: allBooks.reduce(
        (sum, book) => sum + countStatus(book.copies || [], ['available', 'verified']),
        0
      ),
    },
    departments: reports,
  };
};

export const rowsToCsv = (rows, headers) => {
  const escapeCell = (value) => {
    const text = value === undefined || value === null ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [headers.map((header) => escapeCell(header.label)).join(',')];
  rows.forEach((row) => {
    lines.push(headers.map((header) => escapeCell(row[header.key])).join(','));
  });
  return `\uFEFF${lines.join('\n')}`;
};

export const rowsToExcel = async (rows, headers, reportTitle) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ABSU Smart Library';
  workbook.lastModifiedBy = 'ABSU Smart Library';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet(reportTitle || 'Report', {
    pageSetup: { fitToPage: true, fitToHeight: 1, fitToWidth: 1 },
  });

  sheet.columns = headers.map((h) => ({ header: h.label, key: h.key, width: 30 }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0B2458' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  rows.forEach((row, index) => {
    const dataRow = sheet.getRow(index + 2);
    headers.forEach((h) => {
      dataRow.getCell(h.key).value = row[h.key] ?? '';
    });
    dataRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  sheet.getRow(1).height = 25;
  sheet.views = [{ showGridLines: false }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

export const generateDepartmentalPDF = async (report) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const { institution, libraryName, department, generatedAt, totals, rows } = report;

  doc.font('Helvetica-Bold').fontSize(16);
  doc.fillColor('#0B2458');
  doc.text(institution, { align: 'center' });
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').fontSize(13);
  doc.fillColor('#000000');
  doc.text(libraryName, { align: 'center' });
  doc.moveDown(0.5);

  doc.font('Helvetica').fontSize(11);
  doc.fillColor('#333333');
  doc.text(`Department: ${department}`, { align: 'center' });
  doc.text(`Generated: ${new Date(generatedAt).toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(10);
  doc.fillColor('#0B2458');
  doc.text('Summary', { underline: true });
  doc.font('Helvetica').fontSize(9);
  doc.fillColor('#000000');
  doc.text(`Total Titles: ${totals.titles}`);
  doc.text(`Total Copies: ${totals.copies}`);
  doc.text(`Available Copies: ${totals.availableCopies}`);
  doc.moveDown(1);

  const tableTop = doc.y;
  const colWidths = [30, 100, 110, 60, 60, 60, 50, 70, 70, 80, 80, 100];
  const headers = DEPARTMENT_REPORT_HEADERS.map((h) => h.label);
  const startX = 50;

  doc.font('Helvetica-Bold').fontSize(8);
  doc.fillColor('#FFFFFF');
  headers.forEach((h, i) => {
    const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
    doc.rect(x, tableTop, colWidths[i], 20).fill('#0B2458');
    doc.text(h, x + 5, tableTop + 5, { width: colWidths[i] - 10 });
  });

  let y = tableTop + 20;
  rows.forEach((row) => {
    const values = DEPARTMENT_REPORT_HEADERS.map((h) => row[h.key] ?? '');
    doc.font('Helvetica').fontSize(8);
    doc.fillColor('#000000');
    values.forEach((val, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.text(String(val), x + 5, y + 5, { width: colWidths[i] - 10 });
    });
    y += 18;
    if (y > 750) {
      doc.addPage();
      y = 50;
    }
  });

  doc.end();
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

export const generateConsolidatedPDF = async (report) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const { institution, libraryName, department, generatedAt, totals, departments } = report;

  doc.font('Helvetica-Bold').fontSize(16);
  doc.fillColor('#0B2458');
  doc.text(institution, { align: 'center' });
  doc.moveDown(0.5);

  doc.font('Helvetica-Bold').fontSize(13);
  doc.fillColor('#000000');
  doc.text(libraryName, { align: 'center' });
  doc.moveDown(0.5);

  doc.font('Helvetica').fontSize(11);
  doc.fillColor('#333333');
  doc.text(`Report: ${department}`, { align: 'center' });
  doc.text(`Generated: ${new Date(generatedAt).toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(1);

  doc.font('Helvetica-Bold').fontSize(10);
  doc.fillColor('#0B2458');
  doc.text('Summary', { underline: true });
  doc.font('Helvetica').fontSize(9);
  doc.fillColor('#000000');
  doc.text(`Total Titles: ${totals.titles}`);
  doc.text(`Total Copies: ${totals.copies}`);
  doc.text(`Available Copies: ${totals.availableCopies}`);
  doc.moveDown(1);

  departments.forEach((dept, deptIdx) => {
    if (deptIdx > 0) {
      doc.addPage();
    }
    doc.font('Helvetica-Bold').fontSize(11);
    doc.fillColor('#0B2458');
    doc.text(`Department: ${dept.department}`);
    doc.font('Helvetica').fontSize(9);
    doc.fillColor('#000000');
    doc.text(`Titles: ${dept.totals.titles} | Copies: ${dept.totals.copies} | Available: ${dept.totals.availableCopies}`);
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const colWidths = [30, 100, 110, 60, 60, 60, 50, 70, 70, 80, 80, 100];
    const headers = DEPARTMENT_REPORT_HEADERS.map((h) => h.label);
    const startX = 50;

    doc.font('Helvetica-Bold').fontSize(8);
    doc.fillColor('#FFFFFF');
    headers.forEach((h, i) => {
      const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.rect(x, tableTop, colWidths[i], 20).fill('#0B2458');
      doc.text(h, x + 5, tableTop + 5, { width: colWidths[i] - 10 });
    });

    let y = tableTop + 20;
    dept.rows.forEach((row) => {
      const values = DEPARTMENT_REPORT_HEADERS.map((h) => row[h.key] ?? '');
      doc.font('Helvetica').fontSize(8);
      doc.fillColor('#000000');
      values.forEach((val, i) => {
        const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(String(val), x + 5, y + 5, { width: colWidths[i] - 10 });
      });
      y += 18;
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });
  });

  doc.end();
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

export const DEPARTMENT_REPORT_HEADERS = [
  { key: 'sn', label: 'S/N' },
  { key: 'author', label: 'Author' },
  { key: 'title', label: 'Book Title' },
  { key: 'subject', label: 'Subject' },
  { key: 'isbn', label: 'ISBN' },
  { key: 'publisher', label: 'Publisher' },
  { key: 'publicationYear', label: 'Publication Year' },
  { key: 'numberOfCopies', label: 'Number of Copies' },
  { key: 'availableCopies', label: 'Available Copies' },
  { key: 'classificationNumber', label: 'Classification Number' },
  { key: 'accessionNumbers', label: 'Accession Number' },
  { key: 'remarks', label: 'Remarks' },
];

export default {
  listDepartments,
  buildDepartmentalReport,
  buildConsolidatedReport,
  rowsToCsv,
  rowsToExcel,
  generateDepartmentalPDF,
  generateConsolidatedPDF,
  DEPARTMENT_REPORT_HEADERS,
};
