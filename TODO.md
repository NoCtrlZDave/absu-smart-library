# ABSU Smart Library - Implementation Todo List

## Audit Findings
- Stack: React.js + Vite (frontend), Node.js + Express + Mongoose/MongoDB (backend)
- NOTE: Requirements mandate MySQL but existing codebase uses MongoDB. Keeping existing stack per user decision; deviation documented.
- Most backend API routes exist; most frontend pages exist.
- Key gaps: IT Librarian dashboard, Excel/PDF exports, DDC, natural language search, IndexedDB offline, real notification providers, catalogue spreadsheet view.

## Phase 1: IT Librarian Dashboard (Missing dedicated view)
- [x] Create IT Librarian dashboard page (client/src/pages/it-librarian/ITLibrarianDashboard.jsx)
- [x] Add IT Librarian routes to AppRoutes.jsx
- [x] Add IT Librarian sidebar navigation
- [x] IT Librarian can view reservations, approve/reject, view inventory, audit trail

## Phase 2: Reports Export Enhancement (Excel + PDF)
- [x] Add Excel (.xlsx) export to departmental/NUC reports
- [x] Add PDF generation for departmental/NUC reports
- [ ] Add PDF generation for inventory/missing/other reports
- [ ] Add print-ready format support

## Phase 3: Full Catalogue Spreadsheet View (UI)
- [x] Create catalogue spreadsheet page with S/N, Author, Title, Subject, ISBN, Remarks
- [x] Search within spreadsheet
- [x] Filter by department
- [x] Sort columns
- [x] Pagination
- [x] Export to Excel/CSV/Print

## Phase 4: Search Enhancement
- [x] Enhance OPAC search with natural language query support
- [x] Add more filters: ISBN (via search), department, availability, publication year
- [x] Add sorting options

## Phase 5: Dewey Decimal Classification
- [ ] Add DDC classification number field to books
- [ ] DDC configuration for administrators
- [ ] DDC-based shelf location mapping

## Phase 6: Notification Provider Integrations
- [ ] Email provider integration structure (SendGrid/SMTP)
- [ ] SMS provider integration structure
- [ ] WhatsApp Business API provider integration structure
- [ ] Configuration endpoints in Settings
- [ ] Test endpoint for each provider

## Phase 7: IndexedDB Offline Storage
- [ ] Replace localStorage offline queue with IndexedDB
- [ ] Add sync status indicators
- [ ] Conflict resolution for offline transactions
- [ ] Distinguish queued vs server-confirmed transactions

## Phase 8: Location-Based QR Codes
- [ ] QR code generation for book shelf locations
- [ ] Scan-to-locate functionality

## Phase 9: Fine Management Dedicated Views
- [ ] Outstanding fines view for librarians
- [ ] Fine payment recording with references
- [ ] Fine reports

## Phase 10: Testing & Integration
- [ ] Test all modules end-to-end
- [ ] Verify responsive design on mobile/tablet/desktop
- [ ] Verify audit trail for all critical operations
- [ ] Verify no breaking changes to existing modules