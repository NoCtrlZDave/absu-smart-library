import express from 'express';
import Book from '../models/Book.js';
import { protect, requirePermission } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, badRequest } from '../utils/responses.js';
import { CIRCULATION_ROLES } from '../services/policies.js';
import { PERMISSIONS } from '../config/permissions.js';
import {
  buildConsolidatedReport,
  buildDepartmentalReport,
  DEPARTMENT_REPORT_HEADERS,
  listDepartments,
  rowsToCsv,
  rowsToExcel,
  generateDepartmentalPDF,
  generateConsolidatedPDF,
} from '../services/catalogueReports.js';
import logActivity from '../utils/audit.js';

const router = express.Router();

router.use(protect, (req, res, next) => {
  if (!CIRCULATION_ROLES.includes(req.user.role)) {
    return res.status(401).json({ success: false, message: 'You do not have permission to perform this action' });
  }
  next();
});

router.get('/by-category', asyncHandler(async (req, res) => {
  const agg = await Book.aggregate([
    { $group: { _id: '$category', books: { $sum: 1 } } },
    { $sort: { books: -1 } },
  ]);
  return ok(res, agg.map((a) => ({ category: a._id || 'General', books: a.books })));
}));

router.get('/missing', asyncHandler(async (req, res) => {
  const books = await Book.find({ 'copies.status': 'missing' }).lean();
  const items = [];
  books.forEach((b) => {
    b.copies.filter((c) => c.status === 'missing').forEach((c) => {
      items.push({ book: b.title, copy: c.code, location: c.locationString });
    });
  });
  return ok(res, items);
}));

router.get('/by-location', asyncHandler(async (req, res) => {
  const books = await Book.find().lean();
  const bySection = {};
  books.forEach((b) => {
    (b.copies || []).forEach((c) => {
      const loc = c.locationString || b.locationString || 'Unknown location';
      bySection[loc] = (bySection[loc] || 0) + 1;
    });
  });
  return ok(res, Object.entries(bySection)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count));
}));

router.get('/summary', asyncHandler(async (req, res) => {
  const books = await Book.find().lean();
  const allCopies = books.flatMap((b) => b.copies || []);
  const countByStatus = (s) => allCopies.filter((c) => c.status === s).length;
  return ok(res, {
    total_books: books.length,
    total_copies: allCopies.length,
    available: countByStatus('available') + countByStatus('verified'),
    missing: countByStatus('missing'),
    misplaced: countByStatus('misplaced'),
    damaged: countByStatus('damaged'),
  });
}));

router.get('/departments', asyncHandler(async (req, res) => {
  return ok(res, await listDepartments());
}));

router.get('/departmental', requirePermission(PERMISSIONS.REPORTS_DEPARTMENTAL), asyncHandler(async (req, res) => {
  const { department } = req.query;
  if (!department) return badRequest(res, 'A department is required');
  const report = await buildDepartmentalReport({ department: String(department).trim() });
  await logActivity({
    actor: req.user,
    action: 'DEPARTMENTAL_REPORT_GENERATED',
    entity: 'Book',
    details: { department, titles: report.totals.titles, copies: report.totals.copies },
  });
  return ok(res, report);
}));

router.get('/departmental/export', requirePermission(PERMISSIONS.REPORTS_DEPARTMENTAL), asyncHandler(async (req, res) => {
  const { department } = req.query;
  if (!department) return badRequest(res, 'A department is required');
  const report = await buildDepartmentalReport({ department: String(department).trim() });
  const csv = rowsToCsv(report.rows, DEPARTMENT_REPORT_HEADERS);
  const fileSafe = String(department).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="absu-departmental-report-${fileSafe}.csv"`);
  return res.send(csv);
}));

router.get('/departmental/excel', requirePermission(PERMISSIONS.REPORTS_DEPARTMENTAL), asyncHandler(async (req, res) => {
  const { department } = req.query;
  if (!department) return badRequest(res, 'A department is required');
  const report = await buildDepartmentalReport({ department: String(department).trim() });
  const xlsx = await rowsToExcel(report.rows, DEPARTMENT_REPORT_HEADERS, `Departmental Report - ${department}`);
  const fileSafe = String(department).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.set('Content-Disposition', `attachment; filename="absu-departmental-report-${fileSafe}.xlsx"`);
  return res.send(xlsx);
}));

router.get('/departmental/pdf', requirePermission(PERMISSIONS.REPORTS_DEPARTMENTAL), asyncHandler(async (req, res) => {
  const { department } = req.query;
  if (!department) return badRequest(res, 'A department is required');
  const report = await buildDepartmentalReport({ department: String(department).trim() });
  const pdf = await generateDepartmentalPDF(report);
  const fileSafe = String(department).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="absu-departmental-report-${fileSafe}.pdf"`);
  return res.send(pdf);
}));

router.get('/departmental/consolidated', requirePermission(PERMISSIONS.REPORTS_DEPARTMENTAL), asyncHandler(async (req, res) => {
  const report = await buildConsolidatedReport();
  await logActivity({
    actor: req.user,
    action: 'CONSOLIDATED_REPORT_GENERATED',
    entity: 'Book',
    details: { titles: report.totals.titles, copies: report.totals.copies },
  });
  return ok(res, report);
}));

router.get('/departmental/consolidated/excel', requirePermission(PERMISSIONS.REPORTS_DEPARTMENTAL), asyncHandler(async (req, res) => {
  const report = await buildConsolidatedReport();
  const rows = report.departments.flatMap((d) => d.rows.map((r) => ({ ...r, department: d.department })));
  const allHeaders = [
    { key: 'department', label: 'Department' },
    ...DEPARTMENT_REPORT_HEADERS,
  ];
  const xlsx = await rowsToExcel(rows, allHeaders, 'Consolidated Report - All Departments');
  res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.set('Content-Disposition', 'attachment; filename="absu-consolidated-report.xlsx"');
  return res.send(xlsx);
}));

router.get('/departmental/consolidated/pdf', requirePermission(PERMISSIONS.REPORTS_DEPARTMENTAL), asyncHandler(async (req, res) => {
  const report = await buildConsolidatedReport();
  const pdf = await generateConsolidatedPDF(report);
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', 'attachment; filename="absu-consolidated-report.pdf"');
  return res.send(pdf);
}));

export default router;
