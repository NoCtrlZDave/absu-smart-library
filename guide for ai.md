

# ABSU Smart Library — Complete Development Blueprint

**Project:** Design and Implementation of a Smart Library Book Search and Shelf Management System for Abia State University (ABSU)

**Recommended stack**

```text
Frontend     React + Vite
Styling      CSS / Tailwind CSS
Icons        Lucide React
Backend      Django + Django REST Framework
Database     PostgreSQL
Auth         JWT
Hardware     ESP32 + RFID reader (optional smart layer)
Versioning   Git + GitHub
```

---

# 1. SYSTEM OVERVIEW

The system has four major layers:

```text
┌─────────────────────────────────────────────────────┐
│                    USERS                            │
│                                                     │
│       Student       Librarian       Admin           │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                  REACT FRONTEND                     │
│                                                     │
│ Search • Books • Locations • Borrowing • Dashboard │
└────────────────────────┬────────────────────────────┘
                         │ REST API / JSON
                         ▼
┌─────────────────────────────────────────────────────┐
│              DJANGO REST API                        │
│                                                     │
│ Auth • Books • Shelves • Borrowing • Inventory      │
│ Reservations • RFID • Reports                       │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                  POSTGRESQL                         │
│                                                     │
│ Users • Books • Copies • Shelves • Transactions     │
└────────────────────────┬────────────────────────────┘
                         ▲
                         │
                 ┌───────┴────────┐
                 │  SMART LAYER   │
                 │ ESP32 + RFID   │
                 └────────────────┘
```

The **RFID layer should be modular**, so the software works even when the physical hardware is unavailable.

---

# 2. SYSTEM ROLES

## Student

```text
Register/Login
     ↓
Search Books
     ↓
View Book
     ↓
Check Availability
     ↓
View Location
     ↓
Reserve / Borrow
     ↓
Track Borrowing
```

## Librarian

```text
Login
 ↓
Dashboard
 ↓
Manage Books
Manage Copies
Manage Shelves
Manage Borrowing
Manage Returns
Inventory
Misplaced Books
Reports
```

## Administrator

```text
Login
 ↓
Dashboard
 ↓
Manage Users
Manage Librarians
Manage Library Structure
System Settings
RFID Devices
Reports
Audit Logs
```

---

# 3. DATABASE DESIGN

The database should separate a **book title** from an individual **physical copy**.

For example:

```text
Book:
Introduction to Algorithms

Copies:
BK-0001
BK-0002
BK-0003
```

Each copy can have its own:

* accession number
* RFID tag
* condition
* status
* shelf location

That distinction is critical.

---

# 4. ERD

The conceptual ERD should look like this:

```text
                         ┌──────────────┐
                         │    USERS     │
                         ├──────────────┤
                         │ id PK        │
                         │ name         │
                         │ email        │
                         │ role         │
                         └──────┬───────┘
                                │
                 ┌──────────────┼───────────────┐
                 │              │               │
                 ▼              ▼               ▼
          ┌────────────┐ ┌─────────────┐ ┌──────────────┐
          │ BORROWINGS │ │RESERVATIONS │ │ AUDIT_LOGS   │
          └─────┬──────┘ └──────┬──────┘ └──────────────┘
                │               │
                │               │
                ▼               ▼
          ┌────────────┐   ┌─────────────┐
          │BOOK_COPIES │   │    BOOKS    │
          └─────┬──────┘   └──────┬──────┘
                │                 │
                │                 ├──────────┐
                │                 │          │
                ▼                 ▼          ▼
          ┌────────────┐   ┌──────────┐ ┌──────────┐
          │ RFID_TAGS  │   │ AUTHORS  │ │CATEGORY  │
          └────────────┘   └──────────┘ └──────────┘
                │
                │
                ▼
             SHELVES
                │
                ▼
              RACKS
                │
                ▼
             SECTIONS
                │
                ▼
              FLOORS
                │
                ▼
             LIBRARIES
```

---

# 5. DATABASE TABLES

## `users`

| Field         | Type           |
| ------------- | -------------- |
| id            | UUID PK        |
| first_name    | VARCHAR        |
| last_name     | VARCHAR        |
| email         | VARCHAR UNIQUE |
| password      | HASH           |
| matric_number | VARCHAR NULL   |
| role          | ENUM           |
| phone         | VARCHAR        |
| status        | ENUM           |
| created_at    | TIMESTAMP      |

Roles:

```text
STUDENT
LIBRARIAN
ADMIN
```

---

## `libraries`

```text
id
name
description
address
status
created_at
```

Example:

```text
ABSU Main Library
```

---

## `floors`

```text
id
library_id FK
name
floor_number
description
```

---

## `sections`

```text
id
floor_id FK
name
code
description
```

Example:

```text
Engineering
ENG
```

---

## `racks`

```text
id
section_id FK
rack_code
description
status
```

Example:

```text
ENG-R04
```

---

## `shelves`

```text
id
rack_id FK
shelf_code
shelf_number
capacity
status
```

Example:

```text
ENG-R04-S03
```

---

# 6. BOOK TABLES

## `books`

Represents the **bibliographic book**, not the physical copy.

```text
id
isbn
title
subtitle
description
publisher
publication_year
edition
language
category_id FK
cover_image
created_at
updated_at
```

---

## `authors`

```text
id
name
biography
created_at
```

---

## `book_authors`

Many-to-many relationship:

```text
book_id FK
author_id FK
```

A book can have multiple authors.

---

## `categories`

```text
id
name
description
```

Examples:

```text
Engineering
Computer Science
Medicine
Physics
Mathematics
Arts
Social Sciences
```

---

# 7. PHYSICAL BOOK COPIES

## `book_copies`

This is one of the most important tables.

```text
id
book_id FK
accession_number
shelf_id FK
condition
status
acquired_at
```

Status:

```text
AVAILABLE
BORROWED
RESERVED
LOST
DAMAGED
MAINTENANCE
MISPLACED
```

---

# 8. RFID TABLES

## `rfid_tags`

```text
id
book_copy_id FK
tag_uid
status
assigned_at
```

---

## `rfid_readers`

```text
id
reader_name
reader_code
shelf_id FK
ip_address
status
last_seen
```

---

## `shelf_events`

Records detected movement.

```text
id
rfid_tag_id FK
reader_id FK
shelf_id FK
event_type
detected_at
```

Example:

```text
BOOK_DETECTED
BOOK_REMOVED
BOOK_MOVED
```

---

# 9. TRANSACTION TABLES

## `borrowings`

```text
id
user_id FK
book_copy_id FK
borrowed_at
due_date
returned_at
status
renewal_count
```

---

## `reservations`

```text
id
user_id FK
book_id FK
reserved_at
expires_at
status
```

---

## `fines`

```text
id
borrowing_id FK
amount
reason
status
created_at
paid_at
```

---

# 10. NOTIFICATIONS

```text
notifications
----------------
id
user_id
title
message
type
is_read
created_at
```

Useful notifications:

```text
Book due tomorrow
Reservation available
Book overdue
Book returned
Book location changed
```

---

# 11. AUDIT LOG

For administrative accountability:

```text
audit_logs
-----------
id
user_id
action
entity
entity_id
description
ip_address
created_at
```

Example:

```text
Librarian David moved
Book BK-1042
from ENG-R04-S03
to ENG-R05-S01
```

---

# 12. BOOK LOCATION MODEL

The system should never store a vague location like:

```text
"Engineering shelf"
```

Instead:

```text
Library
 ↓
Floor
 ↓
Section
 ↓
Rack
 ↓
Shelf
 ↓
Book Copy
```

Example:

```text
ABSU Main Library
    ↓
Ground Floor
    ↓
Engineering
    ↓
ENG-R04
    ↓
ENG-R04-S03
    ↓
BK-1024
```

---

# 13. API DESIGN

Use RESTful endpoints.

Base URL:

```text
/api/v1/
```

---

## AUTH

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
PUT  /api/v1/auth/profile
```

---

# 14. BOOK API

```http
GET    /api/v1/books
POST   /api/v1/books
GET    /api/v1/books/:id
PUT    /api/v1/books/:id
DELETE /api/v1/books/:id
```

Search:

```http
GET /api/v1/books/search?q=mathematics
```

Filters:

```http
GET /api/v1/books?category=engineering
GET /api/v1/books?status=available
GET /api/v1/books?author=john
```

Book copies:

```http
GET  /api/v1/books/:id/copies
POST /api/v1/books/:id/copies
```

---

# 15. AUTHOR API

```http
GET    /api/v1/authors
POST   /api/v1/authors
GET    /api/v1/authors/:id
PUT    /api/v1/authors/:id
DELETE /api/v1/authors/:id
```

---

# 16. CATEGORY API

```http
GET    /api/v1/categories
POST   /api/v1/categories
PUT    /api/v1/categories/:id
DELETE /api/v1/categories/:id
```

---

# 17. LIBRARY STRUCTURE API

### Libraries

```http
GET  /api/v1/libraries
POST /api/v1/libraries
PUT  /api/v1/libraries/:id
```

### Floors

```http
GET  /api/v1/floors
POST /api/v1/floors
PUT  /api/v1/floors/:id
```

### Sections

```http
GET  /api/v1/sections
POST /api/v1/sections
PUT  /api/v1/sections/:id
```

### Racks

```http
GET  /api/v1/racks
POST /api/v1/racks
PUT  /api/v1/racks/:id
DELETE /api/v1/racks/:id
```

### Shelves

```http
GET  /api/v1/shelves
POST /api/v1/shelves
GET  /api/v1/shelves/:id
PUT  /api/v1/shelves/:id
DELETE /api/v1/shelves/:id
```

---

# 18. LOCATION API

This is important enough to have dedicated endpoints.

```http
GET /api/v1/books/:id/location
GET /api/v1/copies/:id/location
GET /api/v1/shelves/:id/books
```

Example response:

```json
{
  "library": "ABSU Main Library",
  "floor": "Ground Floor",
  "section": "Engineering",
  "rack": "ENG-R04",
  "shelf": "ENG-R04-S03",
  "status": "AVAILABLE"
}
```

---

# 19. BORROWING API

```http
POST /api/v1/borrowings
GET  /api/v1/borrowings
GET  /api/v1/borrowings/:id
POST /api/v1/borrowings/:id/return
POST /api/v1/borrowings/:id/renew
```

Student:

```http
GET /api/v1/me/borrowings
GET /api/v1/me/reservations
```

---

# 20. RESERVATION API

```http
POST   /api/v1/reservations
GET    /api/v1/reservations
DELETE /api/v1/reservations/:id
POST   /api/v1/reservations/:id/cancel
```

---

# 21. INVENTORY API

```http
GET  /api/v1/inventory
POST /api/v1/inventory/start
GET  /api/v1/inventory/:id
POST /api/v1/inventory/:id/scan
POST /api/v1/inventory/:id/complete
```

---

# 22. RFID API

```http
POST /api/v1/rfid/events
GET  /api/v1/rfid/events
GET  /api/v1/rfid/readers
POST /api/v1/rfid/readers
PUT  /api/v1/rfid/readers/:id
```

Example:

```json
{
  "tag_uid": "E200341201234567",
  "reader_code": "READER-E04-S03",
  "event": "BOOK_DETECTED"
}
```

The backend determines:

```text
RFID tag
 ↓
Book Copy
 ↓
Expected Shelf
 ↓
Detected Shelf
 ↓
Compare
```

---

# 23. DASHBOARD API

Admin dashboard:

```http
GET /api/v1/dashboard/admin
```

Response could contain:

```json
{
  "total_books": 24580,
  "available_books": 18420,
  "borrowed_books": 4820,
  "overdue_books": 320,
  "misplaced_books": 47,
  "total_students": 8420
}
```

---

# 24. REPORT API

```http
GET /api/v1/reports/books
GET /api/v1/reports/borrowings
GET /api/v1/reports/overdue
GET /api/v1/reports/inventory
GET /api/v1/reports/misplaced
```

Later:

```http
GET /api/v1/reports/books/export
```

for CSV/PDF exports.

---

# 25. REACT APPLICATION STRUCTURE

I'd structure the frontend like this:

```text
src/
│
├── assets/
│
├── components/
│   ├── common/
│   ├── navigation/
│   ├── books/
│   ├── shelves/
│   ├── borrowing/
│   └── dashboard/
│
├── layouts/
│   ├── PublicLayout.jsx
│   ├── StudentLayout.jsx
│   └── AdminLayout.jsx
│
├── pages/
│   ├── public/
│   ├── auth/
│   ├── student/
│   └── admin/
│
├── services/
│   ├── api.js
│   ├── auth.js
│   ├── books.js
│   ├── shelves.js
│   ├── borrowing.js
│   └── inventory.js
│
├── context/
│   └── AuthContext.jsx
│
├── hooks/
│
├── utils/
│
├── routes/
│   └── AppRoutes.jsx
│
├── App.jsx
└── main.jsx
```

---

# 26. PAGE STRUCTURE

## Public pages

```text
/
├── Home
├── Search
├── Book Details
├── About
├── Contact
├── Login
└── Register
```

---

# 27. STUDENT PAGES

```text
/student
/student/books
/student/books/:id
/student/books/:id/location
/student/borrowed
/student/reservations
/student/history
/student/notifications
/student/profile
```

---

# 28. ADMIN PAGES

```text
/admin
/admin/books
/admin/books/new
/admin/books/:id
/admin/books/:id/edit

/admin/copies

/admin/shelves
/admin/racks
/admin/sections
/admin/floors

/admin/users
/admin/librarians

/admin/borrowings
/admin/returns
/admin/reservations

/admin/inventory
/admin/misplaced

/admin/rfid
/admin/reports
/admin/audit-logs
/admin/settings
```

---

# 29. STUDENT USER FLOW

### Searching for a book

```text
HOME
 ↓
Search
 ↓
Enter "Database Systems"
 ↓
Search Results
 ↓
Select Book
 ↓
Book Details
 ↓
Check Availability
 ↓
View Location
 ↓
Location Instructions
```

Example:

```text
📍 ABSU Main Library

Ground Floor
     ↓
Computer Science
     ↓
Rack CS-02
     ↓
Shelf 04

BOOK: Available
```

---

# 30. BORROWING FLOW

```text
Student
 ↓
Search book
 ↓
Book available?
 ├── NO → Reserve
 │
 └── YES
      ↓
 View book
      ↓
 Request/borrow
      ↓
 Librarian confirms
      ↓
 Book status = BORROWED
      ↓
 Due date generated
      ↓
 Notification sent
```

---

# 31. RETURN FLOW

```text
Student returns book
       ↓
Librarian scans book
       ↓
System identifies copy
       ↓
Borrowing closed
       ↓
Book status = AVAILABLE
       ↓
Check expected shelf
       ↓
Return to correct shelf
```

---

# 32. MISPLACED BOOK FLOW

```text
RFID reader
     ↓
Detects Book A
     ↓
Find Book A in database
     ↓
Expected:
CS-02-S04
     ↓
Detected:
ENG-03-S02
     ↓
Mismatch
     ↓
MISPLACED
     ↓
Admin notification
```

This is arguably the strongest "smart" feature in the entire project.

---

# 33. ADMIN DASHBOARD DESIGN

The dashboard should not simply be a collection of tables.

It should answer:

> **What is happening in the library right now?**

### Header

```text
┌─────────────────────────────────────────────┐
│ ABSU SMART LIBRARY        🔔   David ▼     │
└─────────────────────────────────────────────┘
```

### Sidebar

```text
Dashboard

LIBRARY
  Books
  Book Copies
  Shelves
  Racks
  Sections

CIRCULATION
  Borrowings
  Returns
  Reservations

SMART SYSTEM
  Inventory
  Misplaced Books
  RFID Devices

USERS
  Students
  Librarians

REPORTS

SETTINGS
```

---

# 34. DASHBOARD CARDS

```text
┌──────────────┐ ┌──────────────┐
│ Total Books  │ │ Available    │
│ 24,580       │ │ 18,420       │
└──────────────┘ └──────────────┘

┌──────────────┐ ┌──────────────┐
│ Borrowed     │ │ Overdue      │
│ 4,820        │ │ 320          │
└──────────────┘ └──────────────┘
```

Then:

```text
Recent Borrowings
────────────────────────────

Book              Student       Date
Database Systems  John          Today
Calculus          Mary          Today
Physics           Peter         Yesterday
```

And:

```text
⚠ Attention Required

47 misplaced books
12 shelves near capacity
320 overdue books
3 RFID readers offline
```

---

# 35. BOOK MANAGEMENT UI

Table:

```text
┌────────────────────────────────────────────────────────┐
│ Books                         [+ Add New Book]          │
├────────────────────────────────────────────────────────┤
│ Search books...                                        │
├──────┬────────────────────┬───────────┬───────┬───────┤
│ Cover│ Title              │ Category  │Copies │Status │
├──────┼────────────────────┼───────────┼───────┼───────┤
│ 📕   │ Database Systems   │ Computer  │ 12    │ Active │
│ 📗   │ Engineering Math   │ Engineer. │ 8     │ Active │
└──────┴────────────────────┴───────────┴───────┴───────┘
```

---

# 36. SHELF MANAGEMENT UI

```text
Shelf Management

Engineering
│
├── Rack ENG-01
│    ├── S01   34/40
│    ├── S02   28/40
│    └── S03   40/40 🔴
│
├── Rack ENG-02
│    ├── S01   21/40
│    ├── S02   33/40
│    └── S03   17/40
```

Clicking a shelf opens:

```text
Shelf ENG-01-S02

Capacity: 40
Current Books: 28

Books
────────────────────────
Engineering Mathematics
Thermodynamics
Circuit Analysis
Digital Electronics
...
```

---

# 37. UI DESIGN DIRECTION

Since this is an **ABSU-specific system**, the UI should feel like an institutional university product rather than a generic SaaS dashboard.

I recommend:

### Primary

Deep university-style green

### Supporting

White / off-white backgrounds

### Accent

Gold/yellow for important actions

### Status colors

```text
Available     → green
Borrowed      → blue
Reserved      → amber
Overdue       → red
Misplaced     → red/orange
Maintenance   → gray
```

Keep the interface clean and professional.

Avoid making every component heavily rounded or using excessive gradients.

---

# 38. DESIGN SYSTEM

Create CSS variables rather than scattering colours throughout components.

```css
:root {
  --primary: ...;
  --primary-dark: ...;
  --accent: ...;
  --background: ...;
  --surface: ...;
  --text: ...;
  --muted: ...;
  --border: ...;
  --success: ...;
  --warning: ...;
  --danger: ...;
}
```

Then:

```text
Button
Card
Badge
Input
Modal
Table
Dropdown
Pagination
Toast
Sidebar
Navbar
```

should all use the same design tokens.

This will make the entire application visually consistent.

---

# 39. RESPONSIVE DESIGN

Build **desktop-first for the librarian/admin dashboard**, but ensure it works on tablets and smaller screens.

Student interface should be responsive from the beginning.

```text
Desktop
1280px+

Tablet
768px+

Mobile
320px+
```

Admin sidebar:

```text
Desktop → fixed sidebar

Tablet → collapsible sidebar

Mobile → drawer
```

---

# 40. SEARCH EXPERIENCE

The search page should be one of the best-designed pages.

```text
┌────────────────────────────────────────────┐
│ Search ABSU Library                        │
│                                            │
│ 🔍 Search books, authors, ISBN...          │
└────────────────────────────────────────────┘

Filters

Category
☐ Engineering
☐ Science
☐ Arts

Availability
☐ Available
☐ Borrowed

Location
☐ Ground Floor
☐ First Floor
```

Results:

```text
Engineering Mathematics
John Bird

● Available

📍 Engineering
Rack E04
Shelf 03

[View Book]
```

---

# 41. BOOK LOCATION COMPONENT

Create a reusable React component:

```text
<BookLocation />
```

It receives:

```js
{
  library,
  floor,
  section,
  rack,
  shelf
}
```

and renders:

```text
📍 Location

ABSU Main Library
Ground Floor
Engineering
Rack E04
Shelf 03
```

Later you can replace this with a visual shelf map without changing the backend.

---

# 42. COMPONENT ARCHITECTURE

Reusable components:

```text
Button
Input
Select
Modal
Table
Pagination
Badge
Card
Alert
Toast
Spinner
EmptyState
SearchBar
BookCard
BookGrid
BookLocation
ShelfCard
RackCard
StatsCard
DataTable
```

Feature-specific components:

```text
BorrowBookModal
ReturnBookModal
ShelfMap
InventoryScanner
MisplacedBookAlert
RFIDStatus
```

---

# 43. FRONTEND STATE MANAGEMENT

Don't introduce Redux immediately.

Start with:

```text
React Context
+
useState
+
useReducer
```

Use Context for:

```text
Authentication
User
Role
Theme if necessary
```

For API/server state, a library such as TanStack Query would be useful later.

---

# 44. BACKEND APPLICATION STRUCTURE

For Django:

```text
backend/
│
├── config/
│
├── apps/
│   ├── accounts/
│   ├── books/
│   ├── library/
│   ├── circulation/
│   ├── inventory/
│   ├── rfid/
│   ├── notifications/
│   └── reports/
│
├── requirements.txt
└── manage.py
```

Each application owns its domain.

---

# 45. DJANGO MODELS

Conceptually:

```text
accounts
    User

books
    Book
    Author
    Category
    BookCopy

library
    Library
    Floor
    Section
    Rack
    Shelf

circulation
    Borrowing
    Reservation
    Fine

inventory
    InventorySession
    InventoryScan
    MisplacedBook

rfid
    RFIDTag
    RFIDReader
    ShelfEvent

notifications
    Notification

reports
    AuditLog
```

---

# 46. IMPORTANT BUSINESS RULES

These should be implemented in the backend, not just React.

### Rule 1

A borrowed book cannot be borrowed again.

```text
AVAILABLE → BORROWED
```

### Rule 2

A returned book becomes available.

```text
BORROWED → AVAILABLE
```

### Rule 3

A book can only belong to one physical shelf at a time.

### Rule 4

A misplaced book occurs when:

```text
detected_shelf != expected_shelf
```

### Rule 5

A user cannot exceed the maximum borrowing limit.

Example:

```text
Maximum = 5 books
```

### Rule 6

Overdue status should be calculated automatically.

---

# 47. IMPLEMENTATION ORDER

This is the part I would follow strictly.

Don't jump between frontend pages randomly.

## STEP 01 — Project setup

Create:

```text
Frontend
Backend
Database
Git repository
```

Set up:

```text
React + Vite
Django
DRF
PostgreSQL
Environment variables
Git
```

---

# STEP 02 — Database

Build:

```text
Users
Libraries
Floors
Sections
Racks
Shelves
Books
Authors
Categories
Book Copies
```

Don't implement RFID yet.

---

# STEP 03 — Authentication

Implement:

```text
Register
Login
JWT
Logout
Current User
Role-based permissions
```

Test:

```text
Student
Librarian
Admin
```

---

# STEP 04 — Library structure

Build the hierarchy:

```text
Library
 ↓
Floor
 ↓
Section
 ↓
Rack
 ↓
Shelf
```

Create admin CRUD for each.

---

# STEP 05 — Books

Implement:

```text
Add book
Edit book
Delete book
Add authors
Add categories
Add copies
Assign shelf
```

---

# STEP 06 — Search

Build:

```text
Search
Filtering
Pagination
Sorting
Availability
```

This is the first point where you have a usable system.

---

# STEP 07 — Student interface

Build:

```text
Home
Search
Results
Book Details
Book Location
Login
Student Dashboard
```

---

# STEP 08 — Borrowing

Implement:

```text
Borrow
Return
Renew
Due dates
Borrowing history
Overdue
```

---

# STEP 09 — Reservations

Implement:

```text
Reserve
Cancel
Reservation queue
Reservation expiry
```

---

# STEP 10 — Admin dashboard

Build:

```text
Statistics
Recent activity
Books
Users
Borrowings
Shelves
Reports
```

---

# STEP 11 — Inventory

Implement:

```text
Inventory session
Shelf scanning
Book verification
Missing books
Misplaced books
```

Even without RFID, this should work manually.

---

# STEP 12 — RFID

Only after the above works:

```text
RFID Tag
 ↓
ESP32
 ↓
Reader
 ↓
API
 ↓
Shelf Event
 ↓
Database
```

---

# STEP 13 — Smart detection

Implement:

```text
Expected location
        ↓
Actual detected location
        ↓
Comparison
        ↓
Correct?
 /       \
YES       NO
 |         |
Normal    Misplaced
```

---

# STEP 14 — Notifications

Add:

```text
Overdue
Reservation
Misplaced
RFID offline
Book availability
```

---

# STEP 15 — Reports

Implement:

```text
Total books
Borrowing statistics
Overdue statistics
Inventory statistics
Misplaced books
Popular books
```

---

# STEP 16 — Testing

Test every module independently.

Then test the complete flow:

```text
Student searches
 ↓
Finds book
 ↓
Views shelf
 ↓
Borrows
 ↓
Librarian confirms
 ↓
Book becomes borrowed
 ↓
Student returns
 ↓
Book becomes available
 ↓
Book is returned to shelf
```

---

# 48. DEVELOPMENT MILESTONES

I'd divide the project into these milestones:

| Milestone | Result            |
| --------- | ----------------- |
| M1        | Project setup     |
| M2        | Database + ERD    |
| M3        | Authentication    |
| M4        | Library structure |
| M5        | Book management   |
| M6        | Search            |
| M7        | Student portal    |
| M8        | Borrowing         |
| M9        | Admin dashboard   |
| M10       | Inventory         |
| M11       | RFID              |
| M12       | Testing           |
| M13       | Deployment        |
| M14       | Documentation     |

---

# 49. MVP VS ADVANCED FEATURES

This distinction will save you a lot of time.

### MUST HAVE

```text
Authentication
Book management
Book search
Book details
Book copies
Shelf management
Location tracking
Borrowing
Returns
Reservations
Admin dashboard
Reports
```

### SHOULD HAVE

```text
Inventory
Misplaced book detection
Notifications
Advanced search
Audit logs
```

### ADVANCED

```text
RFID
ESP32
Real-time shelf monitoring
Indoor library map
Automatic shelf detection
```

### FUTURE

```text
Computer vision
AI recommendations
Mobile app
Voice search
Indoor navigation
```

---

# 50. THE FINAL SYSTEM FLOW

Ultimately, your complete system should operate like this:

```text
                         ┌──────────────┐
                         │    STUDENT   │
                         └──────┬───────┘
                                │
                                ▼
                         SEARCH FOR BOOK
                                │
                                ▼
                         BOOK DATABASE
                                │
                    ┌───────────┴───────────┐
                    │                       │
                AVAILABLE                UNAVAILABLE
                    │                       │
                    ▼                       ▼
             VIEW LOCATION             RESERVE
                    │
                    ▼
             LIBRARY LOCATION
                    │
                    ▼
                 FLOOR
                    │
                    ▼
                SECTION
                    │
                    ▼
                  RACK
                    │
                    ▼
                 SHELF
                    │
                    ▼
                  BOOK
                    │
                    ▼
                BORROW
                    │
                    ▼
                RETURN
                    │
                    ▼
             INVENTORY CHECK
                    │
                    ▼
             RFID / MANUAL SCAN
                    │
                    ▼
             LOCATION MATCH?
               /           \
             YES            NO
              │              │
              ▼              ▼
           NORMAL         MISPLACED
                             │
                             ▼
                          ALERT
                             │
                             ▼
                         LIBRARIAN
```

# 51. What I would build first

If we're going to **actually develop this together**, I recommend we don't begin with the dashboard.

The correct order is:

```text
1. Final requirements
       ↓
2. ERD/database schema
       ↓
3. Backend project
       ↓
4. Django models
       ↓
5. REST API
       ↓
6. Authentication
       ↓
7. React architecture
       ↓
8. Design system
       ↓
9. Student UI
       ↓
10. Admin UI
       ↓
11. Integration
       ↓
12. RFID
       ↓
13. Testing
       ↓
14. Deployment
       ↓
15. Project documentation
```

## Frontend Development Roadmap

### 1. Overall Frontend Structure

Build the frontend around **3 user experiences**:

```text
ABSU SMART LIBRARY
│
├── Public / Student Portal
│   ├── Home
│   ├── Search Books
│   ├── Book Details
│   ├── Library Location
│   ├── Login
│   ├── Register
│   └── Student Dashboard
│
├── Librarian Portal
│   ├── Dashboard
│   ├── Books
│   ├── Book Copies
│   ├── Shelves
│   ├── Borrowing
│   ├── Returns
│   ├── Reservations
│   ├── Inventory
│   ├── Misplaced Books
│   └── Reports
│
└── Administrator Portal
    ├── Dashboard
    ├── Users
    ├── Librarians
    ├── Library Structure
    ├── System Monitoring
    └── Settings
```

---

# 2. Phase One: Design System

Before building pages, create the common UI.

### Components

```text
components/
│
├── Navbar
├── Footer
├── Sidebar
├── Button
├── Input
├── Select
├── Modal
├── Dropdown
├── SearchBar
├── BookCard
├── BookTable
├── StatusBadge
├── Pagination
├── LoadingSpinner
├── EmptyState
├── Toast
├── Breadcrumb
└── ConfirmDialog
```

### Design system

Define:

* ABSU brand colors
* Typography
* Font sizes
* Spacing
* Border radius
* Shadows
* Buttons
* Form fields
* Cards
* Tables
* Icons
* Responsive breakpoints

**Do this before the individual pages**, otherwise every developer will create slightly different versions of the same component.

---

# 3. Phase Two: Public/Student Pages

These are the pages students interact with.

## Page 1: Home

Route:

```text
/
```

Sections:

```text
Navbar
Hero
Search Bar
Popular Categories
Featured Books
Recently Added Books
How It Works
Library Information
Footer
```

The primary CTA should be:

> **Search for a Book**

---

# 4. Page 2: Search Books

Route:

```text
/search
```

This is one of the most important pages.

### Features

```text
Search
Filter
Sort
Pagination
Book cards/list
Availability
Location
```

Example:

```text
Search ABSU Library
[ Search title, author, ISBN... ]

Filters
Category
Author
Availability
Publication Year

Results

────────────────────────────
Engineering Mathematics
John Bird

Available
📍 Engineering • Rack E04 • Shelf 03

[View Book]
────────────────────────────
```

---

# 5. Page 3: Book Details

Route:

```text
/books/:id
```

Show:

* Book cover
* Title
* Author
* ISBN
* Publisher
* Category
* Description
* Availability
* Number of copies
* Physical location
* Borrowing status
* Reservation button

Most importantly:

### "Where can I find this book?"

```text
ABSU Main Library

Engineering Section
      ↓
Rack E04
      ↓
Shelf 03
```

CTA:

**Locate Book**

---

# 6. Page 4: Book Location

Route:

```text
/books/:id/location
```

This can be a dedicated location page or modal.

Show a visual representation:

```text
ENGINEERING SECTION

Rack E04

┌──────────────────────┐
│ Shelf 01             │
├──────────────────────┤
│ Shelf 02             │
├──────────────────────┤
│ Shelf 03   BOOK HERE │
├──────────────────────┤
│ Shelf 04             │
└──────────────────────┘
```

Later, this can become an interactive library map.

---

# 7. Authentication Pages

Create:

```text
/login
/register
/forgot-password
/reset-password
```

Registration fields could include:

```text
Full Name
Matric Number
Email
Password
Confirm Password
```

---

# 8. Student Dashboard

Route:

```text
/student/dashboard
```

Dashboard cards:

```text
Currently Borrowed
Overdue
Reservations
Books Read
```

Then:

```text
Currently Borrowed Books

Book              Due Date       Status
Database Systems  Sept 10        Active
Calculus           Sept 12        Active
```

---

# 9. Student Borrowing Page

```text
/student/borrowed-books
```

Display:

* Current books
* Borrow date
* Due date
* Days remaining
* Return status

---

# 10. Student Reservations

```text
/student/reservations
```

Show:

```text
Book
Reservation date
Status
Availability
Cancel reservation
```

---

# 11. Student History

```text
/student/history
```

Show previous:

* Borrowed books
* Returned books
* Dates
* Fines, if applicable

---

# 12. Student Profile

```text
/student/profile
```

Sections:

```text
Personal Information
Academic Information
Account Settings
Password
Notifications
```

---

# 13. Phase Three: Librarian Portal

This should have a completely different layout.

Use:

```text
Sidebar
Top Navigation
Main Content
```

---

# 14. Librarian Dashboard

Route:

```text
/librarian/dashboard
```

Top statistics:

```text
Total Books       Available
24,580             18,420

Borrowed          Overdue
4,820              320

Reservations      Misplaced
128                47
```

Then:

```text
Recent Borrowing Activity
```

and:

```text
Shelf Status
```

---

# 15. Books Management

Route:

```text
/librarian/books
```

Features:

* Search
* Filter
* Add book
* Edit book
* Delete book
* View details
* Manage copies

Table:

```text
Book
Author
Category
Copies
Available
Location
Status
Actions
```

---

# 16. Add Book

```text
/librarian/books/add
```

Fields:

```text
Title
ISBN
Author
Publisher
Publication Year
Category
Description
Book Cover
```

Then:

**Create Book**

---

# 17. Book Copies

Route:

```text
/librarian/book-copies
```

This is important because one book title can have multiple physical copies.

Example:

```text
Engineering Mathematics

Copy 001
Available
E04 / Shelf 03

Copy 002
Borrowed
—

Copy 003
Available
E04 / Shelf 03
```

---

# 18. Shelf Management

Route:

```text
/librarian/shelves
```

Structure:

```text
Library
 ↓
Floor
 ↓
Section
 ↓
Rack
 ↓
Shelf
```

The librarian should be able to:

* Create shelf
* Edit shelf
* Delete shelf
* Assign rack
* Set capacity
* View books
* View shelf status

---

# 19. Rack Management

```text
/librarian/racks
```

Example:

```text
Engineering Section

Rack E01
Rack E02
Rack E03
Rack E04
```

Clicking E04:

```text
Rack E04

Shelf 01
Shelf 02
Shelf 03
Shelf 04
Shelf 05
```

---

# 20. Library Structure

Instead of making everything separate pages, you can also have:

```text
/librarian/library-structure
```

Where librarians manage:

```text
Library
 ├── Floors
 │   ├── Sections
 │   │   ├── Racks
 │   │   │   └── Shelves
```

This will make the physical library hierarchy easy to manage.

---

# 21. Borrowing Management

Route:

```text
/librarian/borrowings
```

Show:

```text
Student
Book
Copy
Borrowed Date
Due Date
Status
Action
```

Actions:

```text
View
Extend
Return
```

---

# 22. Returns

```text
/librarian/returns
```

A librarian can:

```text
Search student
Search book
Scan/enter book ID
Confirm return
```

After return:

```text
Book status → AVAILABLE
Student record → RETURNED
Shelf → Updated
```

---

# 23. Reservations

```text
/librarian/reservations
```

Show:

```text
Student
Book
Date
Status
Action
```

---

# 24. Inventory Management

This is one of the major features of the project.

Route:

```text
/librarian/inventory
```

Display:

```text
Total Books
Verified
Missing
Misplaced
Damaged
```

Example:

```text
Inventory Status

✓ 18,300 Verified
⚠ 47 Misplaced
⚠ 12 Missing
⚠ 31 Damaged
```

---

# 25. Misplaced Books

Route:

```text
/librarian/misplaced-books
```

This is where the "smart" component becomes visible.

Example:

```text
MISPLACED BOOK

Book:
Introduction to Algorithms

Expected:
CS Section
Rack CS02
Shelf 04

Detected:
Engineering Section
Rack E03
Shelf 02

[Resolve]
```

---

# 26. RFID / Smart Monitoring

Route:

```text
/librarian/smart-monitoring
```

Dashboard:

```text
RFID SYSTEM

Readers Online       8
Books Detected       18,420
Misplaced Books      47
Unknown Tags         3
```

Then:

```text
Recent RFID Events

Book                    Reader       Location
Engineering Mathematics RFID-04      E04-S03
Database Systems        RFID-02      CS02-S04
```

If hardware isn't ready, this page can initially use simulated data.

---

# 27. Reports

Route:

```text
/librarian/reports
```

Reports:

* Most borrowed books
* Most active students
* Overdue books
* Missing books
* Misplaced books
* Inventory status
* Books by category
* Monthly borrowing statistics

Charts can be added here.

---

# 28. Phase Four: Administrator Portal

The administrator has higher privileges.

### Dashboard

```text
/admin/dashboard
```

### Users

```text
/admin/users
```

### Librarians

```text
/admin/librarians
```

### Library Structure

```text
/admin/library
```

### System Logs

```text
/admin/logs
```

### Settings

```text
/admin/settings
```

---

# 29. Complete Page List

Here's the actual list I would give your frontend team.

### Public

```text
/
 /search
 /books/:id
 /books/:id/location
 /login
 /register
 /forgot-password
 /reset-password
```

### Student

```text
/student/dashboard
/student/borrowed-books
/student/reservations
/student/history
/student/profile
/student/notifications
```

### Librarian

```text
/librarian/dashboard
/librarian/books
/librarian/books/add
/librarian/books/:id
/librarian/book-copies
/librarian/shelves
/librarian/racks
/librarian/library-structure
/librarian/borrowings
/librarian/returns
/librarian/reservations
/librarian/inventory
/librarian/misplaced-books
/librarian/smart-monitoring
/librarian/reports
```

### Admin

```text
/admin/dashboard
/admin/users
/admin/librarians
/admin/library
/admin/logs
/admin/settings
```

---

# 30. Development Order

Don't build them randomly.

I recommend:

### Sprint 1: Foundation

```text
1. Project setup
2. Routing
3. Design system
4. Navbar
5. Sidebar
6. Authentication UI
7. Responsive layout
```

### Sprint 2: Student Experience

```text
8. Home
9. Search
10. Search Results
11. Book Details
12. Book Location
13. Student Dashboard
14. Borrowed Books
15. Reservations
16. History
17. Profile
```

### Sprint 3: Librarian

```text
18. Librarian Dashboard
19. Books
20. Add Book
21. Book Copies
22. Shelves
23. Racks
24. Library Structure
25. Borrowings
26. Returns
27. Reservations
```

### Sprint 4: Smart Management

```text
28. Inventory
29. Misplaced Books
30. RFID Monitoring
31. Reports
```

### Sprint 5: Admin

```text
32. Admin Dashboard
33. Users
34. Librarians
35. Library Management
36. Logs
37. Settings
```

### Sprint 6: Integration

```text
38. Connect API
39. Authentication
40. Search API
41. Book API
42. Shelf API
43. Borrowing API
44. RFID API
```

### Sprint 7: Quality

```text
45. Responsive design
46. Loading states
47. Error states
48. Empty states
49. Form validation
50. Accessibility
51. Performance
52. Final testing
```

---

# 31. How I would divide the frontend team

If you have multiple frontend developers, don't give everyone random pages.

### Developer 1: Public + Search

```text
Home
Search
Book Details
Book Location
Authentication
```

### Developer 2: Student Portal

```text
Student Dashboard
Borrowed Books
Reservations
History
Profile
Notifications
```

### Developer 3: Librarian Portal

```text
Dashboard
Books
Book Copies
Borrowings
Returns
Reservations
```

### Developer 4: Smart/Shelf Management

```text
Shelves
Racks
Library Structure
Inventory
Misplaced Books
RFID Monitoring
Reports
```

Then have **one person act as frontend lead** responsible for:

```text
Git branches
Component consistency
Routing
API integration
Code reviews
Responsive design
Merge conflicts
```

---

# 32. Git Branch Structure

Since you're working with multiple developers, I'd recommend:

```text
main
│
└── dev
     │
     ├── feature/public-pages
     ├── feature/student-dashboard
     ├── feature/librarian-dashboard
     ├── feature/shelf-management
     └── feature/admin-dashboard
```

Developers should **not directly push everything into `main`**.

Workflow:

```text
Create branch
     ↓
Build feature
     ↓
Commit
     ↓
Push
     ↓
Pull Request
     ↓
Code Review
     ↓
Merge into dev
     ↓
Testing
     ↓
main
```

---

# 33. The user flow you should give every frontend developer

The most important flow is:

```text
                    STUDENT
                       │
                       ▼
                    HOME
                       │
                       ▼
                 SEARCH BOOK
                       │
                       ▼
                SEARCH RESULTS
                       │
                       ▼
                 BOOK DETAILS
                       │
            ┌──────────┴──────────┐
            │                     │
        AVAILABLE             UNAVAILABLE
            │                     │
            ▼                     ▼
      VIEW LOCATION           RESERVE
            │
            ▼
       SHELF LOCATION
            │
            ▼
       FIND BOOK
```

And the librarian flow:

```text
Librarian
    ↓
Dashboard
    ↓
Manage Books
    ↓
Manage Copies
    ↓
Assign Location
    ↓
Shelf
    ↓
Inventory
    ↓
RFID Detection
    ↓
Compare Expected vs Actual
    ↓
Misplaced Book Alert
```

## The key principle

Every frontend developer should understand that the application has **one central journey**:

> **A student searches for a book and the system tells them exactly where to find it.**

Everything else supports that journey.

So I would make **Search → Book Details → Location → Shelf** the first complete feature you build. Once that works end to end, build borrowing, reservations, inventory, and finally the RFID/smart monitoring layer around it.

---

If you want, I can:

* Develop detailed user stories for each frontend page and component
* Outline API integration points for front-end features
* Create a sprint-wise detailed development task list for frontend team


# ABSU Smart Library — Frontend User Stories & Acceptance Criteria

## 1. Product-Level User Roles

The frontend should support three primary roles:

| Role              | Primary Goal                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------- |
| **Student**       | Find books, locate them physically, borrow/reserve them, and manage their library activity   |
| **Librarian**     | Manage books, copies, shelves, borrowing, inventory, misplaced books, and library operations |
| **Administrator** | Manage users, librarians, library structure, system configuration, and monitoring            |

The core product journey is:

**Search → Discover → Locate → Borrow/Reserve → Return → Inventory**

---

# 2. Global UI Components

These components should be developed first because they will be reused throughout the application.

## US-COMP-01 — Navbar

**As a** visitor/student,
**I want** a consistent navigation bar,
**so that** I can quickly access important areas of the library system.

### Interactions

* Click logo → Home
* Click Search → Search page
* Click Login → Login
* Click Dashboard → appropriate dashboard
* Open profile menu
* Logout
* Responsive mobile menu

### Acceptance Criteria

* [ ] Logo navigates to `/`
* [ ] Navigation changes according to authentication state
* [ ] Student sees student-specific navigation
* [ ] Librarian sees librarian navigation
* [ ] Admin sees admin navigation
* [ ] Logout option is available to authenticated users
* [ ] Mobile navigation is usable on smaller screens
* [ ] Active page is visually identifiable

---

# 3. Sidebar

**As a** librarian/administrator,
**I want** a sidebar containing my available modules,
**so that** I can move between management sections efficiently.

### Acceptance Criteria

* [ ] Sidebar displays role-appropriate navigation
* [ ] Active route is highlighted
* [ ] Sidebar can collapse where appropriate
* [ ] Icons have accessible labels
* [ ] Unauthorized routes are not displayed
* [ ] Navigation works without full-page reload

---

# 4. SearchBar

**As a** student,
**I want** to search for books using keywords,
**so that** I can quickly find the book I need.

### User interactions

Search by:

* Title
* Author
* ISBN
* Keyword

### Acceptance Criteria

* [ ] User can enter a search term
* [ ] Search can be submitted using button or Enter
* [ ] Empty searches are handled appropriately
* [ ] Loading state appears during search
* [ ] Search results display relevant books
* [ ] No-results state is displayed when nothing matches
* [ ] Search term can be cleared
* [ ] Search works responsively

---

# 5. Button Component

Buttons should support:

```text
Primary
Secondary
Outline
Danger
Success
Disabled
Loading
```

### Acceptance Criteria

* [ ] Buttons have consistent styling
* [ ] Disabled buttons cannot be activated
* [ ] Loading buttons prevent duplicate submissions
* [ ] Keyboard interaction works
* [ ] Button states are visually distinguishable

---

# 6. Input Component

Used across authentication, book management, search, and settings.

### Acceptance Criteria

* [ ] Supports label
* [ ] Supports placeholder
* [ ] Supports validation message
* [ ] Supports required state
* [ ] Supports disabled state
* [ ] Supports password visibility toggle where necessary
* [ ] Error state is visually clear
* [ ] Accessible label is associated with input

---

# 7. Modal

**As a** user,
**I want** important actions to open confirmation dialogs,
**so that** I don't accidentally perform destructive actions.

### Examples

* Delete book
* Delete shelf
* Cancel reservation
* Confirm return
* Confirm logout

### Acceptance Criteria

* [ ] Modal opens when triggered
* [ ] Background is visually separated
* [ ] Close button works
* [ ] Escape closes modal where appropriate
* [ ] Confirmation action works
* [ ] Cancel action leaves data unchanged
* [ ] Focus is managed correctly

---

# 8. Toast Notification

Used for system feedback.

Examples:

```text
Book added successfully
Reservation cancelled
Book returned successfully
Unable to delete shelf
```

### Acceptance Criteria

* [ ] Success messages are displayed after successful operations
* [ ] Error messages explain failures
* [ ] Toast automatically disappears when appropriate
* [ ] User can dismiss it manually
* [ ] Multiple notifications don't break the interface

---

# 9. StatusBadge

Used for:

```text
Available
Borrowed
Reserved
Overdue
Missing
Misplaced
Damaged
Verified
```

### Acceptance Criteria

* [ ] Each status has a distinct visual treatment
* [ ] Status text is understandable without relying solely on color
* [ ] Badge works consistently across cards and tables

---

# 10. BookCard

**As a** student,
**I want** to see essential book information in a compact card,
**so that** I can decide whether to view it.

### Display

* Cover
* Title
* Author
* Category
* Availability
* Location

### Acceptance Criteria

* [ ] Book title is visible
* [ ] Author is visible
* [ ] Availability is visible
* [ ] Location is visible when available
* [ ] Clicking the card opens book details
* [ ] Missing cover uses fallback image
* [ ] Card works on desktop and mobile

---

# 11. BookTable

Used primarily by librarians/admins.

### Acceptance Criteria

* [ ] Displays book records
* [ ] Supports sorting where required
* [ ] Supports pagination
* [ ] Provides row actions
* [ ] Handles long titles without breaking layout
* [ ] Responsive behavior is defined

---

# 12. EmptyState

Examples:

```text
No books found
You haven't borrowed any books
No reservations
No misplaced books detected
```

### Acceptance Criteria

* [ ] Clearly explains the empty state
* [ ] Provides an appropriate action where possible
* [ ] Does not look like an error

---

# 13. Loading State

Every API-driven page should have a loading state.

### Acceptance Criteria

* [ ] Loading indicator appears while data is being retrieved
* [ ] Layout does not unexpectedly jump
* [ ] User cannot accidentally submit duplicate actions
* [ ] Skeleton loaders may be used for major content areas

---

# 14. Pagination

### Acceptance Criteria

* [ ] Previous/next buttons work
* [ ] Current page is identifiable
* [ ] Disabled state appears on unavailable navigation
* [ ] Page size can be configurable where required
* [ ] Pagination state remains consistent with search/filtering

---

# 15. PUBLIC / STUDENT EXPERIENCE

# US-01 — Home Page

**Route:** `/`

**As a** student or visitor,
**I want** to understand what the ABSU Smart Library offers,
**so that** I can quickly search for books or access library services.

### UI Sections

1. Navbar
2. Hero
3. Search bar
4. Popular categories
5. Featured books
6. Recently added books
7. How it works
8. Library information
9. Footer

### Acceptance Criteria

* [ ] Page loads without authentication
* [ ] Search is immediately visible
* [ ] Search redirects to results
* [ ] Featured books are clickable
* [ ] Categories can initiate filtered searches
* [ ] Page is responsive
* [ ] Appropriate loading states exist for dynamic content

---

# US-02 — Search Books

**Route:** `/search`

**As a** student,
**I want** to search and filter library books,
**so that** I can find the exact book I need.

### Interactions

User can:

* Search
* Filter by category
* Filter by author
* Filter by availability
* Filter by year
* Sort results
* Open book
* Clear filters
* Navigate pages

### Acceptance Criteria

* [ ] Search results correspond to entered query
* [ ] Filters can be combined
* [ ] Clearing filters restores default results
* [ ] Availability is clearly displayed
* [ ] Each result provides access to book details
* [ ] Empty results state is displayed
* [ ] Loading state appears
* [ ] Pagination works
* [ ] URL/query state can be preserved where appropriate

---

# US-03 — Book Details

**Route:** `/books/:id`

**As a** student,
**I want** to view complete information about a book,
**so that** I can determine whether and where I can access it.

### Display

```text
Cover
Title
Author
ISBN
Publisher
Year
Category
Description
Availability
Copies
Location
```

### Acceptance Criteria

* [ ] Correct book information is displayed
* [ ] Availability is clearly shown
* [ ] Number of available copies is shown
* [ ] Physical location is shown
* [ ] Locate Book action is available
* [ ] Reserve action appears when applicable
* [ ] Borrow action appears according to system rules
* [ ] Invalid book ID produces an appropriate error page

---

# US-04 — Book Location

**Route:** `/books/:id/location`

**As a** student,
**I want** to know exactly where a book is located,
**so that** I can find it physically inside the library.

### Location hierarchy

```text
Library
 ↓
Floor
 ↓
Section
 ↓
Rack
 ↓
Shelf
```

### Acceptance Criteria

* [ ] Library name is displayed
* [ ] Floor is displayed where applicable
* [ ] Section is displayed
* [ ] Rack is displayed
* [ ] Shelf is displayed
* [ ] Target location is visually emphasized
* [ ] User can return to book details
* [ ] Missing location displays an appropriate message

---

# US-05 — Login

**Route:** `/login`

**As a** registered user,
**I want** to authenticate,
**so that** I can access my appropriate dashboard.

### Acceptance Criteria

* [ ] Email/matric number field exists as defined by backend
* [ ] Password field exists
* [ ] Validation occurs
* [ ] Invalid credentials display an error
* [ ] Successful login redirects according to role
* [ ] Loading state prevents duplicate login requests
* [ ] Forgot-password link exists
* [ ] Registration link exists

---

# US-06 — Registration

**Route:** `/register`

**As a** student,
**I want** to create a library account,
**so that** I can use personalized library services.

### Fields

```text
Full Name
Matric Number
Email
Password
Confirm Password
```

### Acceptance Criteria

* [ ] Required fields are validated
* [ ] Email format is validated
* [ ] Password requirements are displayed
* [ ] Password confirmation must match
* [ ] Existing account errors are handled
* [ ] Successful registration provides feedback
* [ ] User is redirected appropriately

---

# US-07 — Forgot Password

**Route:** `/forgot-password`

**As a** user who forgot their password,
**I want** to request a password reset,
**so that** I can regain access.

### Acceptance Criteria

* [ ] User can enter registered email
* [ ] Invalid email format is rejected
* [ ] Request shows loading state
* [ ] Success feedback is displayed
* [ ] Security-sensitive information is not unnecessarily exposed

---

# 16. STUDENT DASHBOARD

# US-08 — Student Dashboard

**Route:** `/student/dashboard`

**As a** student,
**I want** an overview of my library activity,
**so that** I can quickly see what requires my attention.

### Dashboard cards

```text
Currently Borrowed
Overdue
Reservations
Books Read
```

### Acceptance Criteria

* [ ] Statistics are loaded from backend
* [ ] Borrowed count is displayed
* [ ] Overdue count is displayed
* [ ] Reservation count is displayed
* [ ] Relevant activity is shown
* [ ] Clicking cards navigates to relevant sections
* [ ] Loading and error states exist

---

# US-09 — Borrowed Books

**Route:** `/student/borrowed-books`

**As a** student,
**I want** to see books currently in my possession,
**so that** I know what I need to return and when.

### Display

```text
Book
Borrow Date
Due Date
Days Remaining
Status
```

### Acceptance Criteria

* [ ] All active loans are displayed
* [ ] Due dates are visible
* [ ] Overdue books are clearly identified
* [ ] Book details can be opened
* [ ] Empty state appears when no books are borrowed

---

# US-10 — Reservations

**Route:** `/student/reservations`

**As a** student,
**I want** to manage my reservations,
**so that** I can track books I am waiting for.

### Acceptance Criteria

* [ ] Active reservations are displayed
* [ ] Reservation date is shown
* [ ] Status is shown
* [ ] User can cancel eligible reservations
* [ ] Cancellation requires confirmation
* [ ] Successful cancellation updates the interface

---

# US-11 — Borrowing History

**Route:** `/student/history`

**As a** student,
**I want** to view my previous borrowing activity,
**so that** I can keep track of my library history.

### Acceptance Criteria

* [ ] Returned books are displayed
* [ ] Borrow and return dates are shown
* [ ] History can be paginated
* [ ] Empty state exists
* [ ] Book details remain accessible

---

# US-12 — Student Profile

**Route:** `/student/profile`

**As a** student,
**I want** to manage my profile information,
**so that** my account remains accurate.

### Acceptance Criteria

* [ ] Current information is displayed
* [ ] Editable fields are clearly identified
* [ ] Validation occurs
* [ ] Save action provides feedback
* [ ] Password change is separated from normal profile editing

---

# US-13 — Notifications

**Route:** `/student/notifications`

Notifications could include:

```text
Book due soon
Book overdue
Reservation available
Reservation cancelled
System announcements
```

### Acceptance Criteria

* [ ] Notifications display date/time
* [ ] Read/unread status is visible
* [ ] User can mark notifications as read
* [ ] Empty notification state exists

---

# 17. LIBRARIAN PORTAL

# US-14 — Librarian Dashboard

**Route:** `/librarian/dashboard`

**As a** librarian,
**I want** an operational overview,
**so that** I can immediately identify library issues.

### Statistics

```text
Total Books
Available
Borrowed
Overdue
Reservations
Misplaced
```

### Acceptance Criteria

* [ ] Statistics are retrieved from backend
* [ ] Critical issues are visually identifiable
* [ ] Recent activity is displayed
* [ ] Shelf/inventory status is summarized
* [ ] Dashboard links lead to detailed modules

---

# US-15 — Manage Books

**Route:** `/librarian/books`

**As a** librarian,
**I want** to manage the library catalogue,
**so that** book records remain accurate.

### Actions

```text
Search
Filter
Add
Edit
View
Delete
Manage Copies
```

### Acceptance Criteria

* [ ] Librarian can search books
* [ ] Librarian can filter books
* [ ] Books display in table/list
* [ ] Add-book action works
* [ ] Edit action opens correct book
* [ ] Delete requires confirmation
* [ ] Successful operations refresh/update displayed data

---

# US-16 — Add Book

**Route:** `/librarian/books/add`

**As a** librarian,
**I want** to add a book to the catalogue,
**so that** students can discover it.

### Acceptance Criteria

* [ ] Required fields are validated
* [ ] ISBN validation is performed
* [ ] Cover upload supports defined file types
* [ ] Form submission shows loading state
* [ ] Duplicate/invalid data errors are handled
* [ ] Successful creation provides feedback
* [ ] User is redirected to appropriate page

---

# US-17 — Book Copy Management

**Route:** `/librarian/book-copies`

**As a** librarian,
**I want** to manage individual physical copies,
**so that** the system knows exactly which physical books exist.

### Example

```text
Engineering Mathematics

Copy #001 — Available
Copy #002 — Borrowed
Copy #003 — Available
```

### Acceptance Criteria

* [ ] Copies are associated with a book
* [ ] Each copy has a unique identifier
* [ ] Copy status is visible
* [ ] Physical location is visible
* [ ] Librarian can add/edit copies according to permissions
* [ ] Borrowed copies cannot be incorrectly marked available

---

# US-18 — Shelf Management

**Route:** `/librarian/shelves`

**As a** librarian,
**I want** to manage shelves,
**so that** books can be assigned accurate physical locations.

### Acceptance Criteria

* [ ] Shelves can be listed
* [ ] Shelf identifier is visible
* [ ] Rack relationship is visible
* [ ] Capacity can be displayed
* [ ] Librarian can create/edit shelves where permitted
* [ ] Deleting a shelf requires confirmation
* [ ] System prevents invalid deletion where dependencies exist

---

# US-19 — Rack Management

**Route:** `/librarian/racks`

**As a** librarian,
**I want** to manage racks,
**so that** shelves can be organized correctly.

### Acceptance Criteria

* [ ] Racks are grouped by section
* [ ] Rack identifier is displayed
* [ ] Shelves belonging to rack can be viewed
* [ ] Librarian can add/edit racks
* [ ] Invalid/dependent deletion is prevented

---

# US-20 — Library Structure

**Route:** `/librarian/library-structure`

**As a** librarian,
**I want** to visualize and manage the physical library hierarchy,
**so that** locations remain organized.

### UI

```text
Library
 ├── Floor 1
 │    ├── Science
 │    │    ├── Rack S01
 │    │    │    ├── Shelf 01
 │    │    │    └── Shelf 02
 │    │    └── Rack S02
 │
 └── Floor 2
      └── Engineering
```

### Acceptance Criteria

* [ ] Hierarchy is understandable
* [ ] Nodes can be expanded/collapsed
* [ ] User can select a location
* [ ] Related books can be viewed
* [ ] Create/edit actions appear according to permissions

---

# US-21 — Borrowing Management

**Route:** `/librarian/borrowings`

**As a** librarian,
**I want** to view and manage active borrowing transactions,
**so that** I can control book circulation.

### Acceptance Criteria

* [ ] Student is identified
* [ ] Book and copy are identified
* [ ] Borrow date is shown
* [ ] Due date is shown
* [ ] Status is displayed
* [ ] Librarian can open transaction details
* [ ] Eligible transactions can be extended according to business rules

---

# US-22 — Returns

**Route:** `/librarian/returns`

**As a** librarian,
**I want** to process returned books,
**so that** the system accurately updates availability.

### Interaction

```text
Search Student/Book
        ↓
Identify Copy
        ↓
Confirm Return
        ↓
Update Status
```

### Acceptance Criteria

* [ ] Librarian can identify borrowing transaction
* [ ] Correct physical copy is identified
* [ ] Return requires confirmation
* [ ] Successful return updates copy status
* [ ] Student's loan is closed
* [ ] Relevant inventory information is updated
* [ ] Error is displayed if return cannot be processed

---

# US-23 — Librarian Reservations

**Route:** `/librarian/reservations`

**As a** librarian,
**I want** to manage reservations,
**so that** students receive books according to library rules.

### Acceptance Criteria

* [ ] Reservations display student
* [ ] Book is displayed
* [ ] Reservation date is displayed
* [ ] Status is displayed
* [ ] Librarian can view reservation details
* [ ] Eligible actions are available
* [ ] Status changes are reflected immediately

---

# 18. SMART LIBRARY FEATURES

# US-24 — Inventory Dashboard

**Route:** `/librarian/inventory`

**As a** librarian,
**I want** to monitor inventory status,
**so that** I can identify missing, misplaced, and verified books.

### Dashboard

```text
Total
Verified
Missing
Misplaced
Damaged
```

### Acceptance Criteria

* [ ] Inventory statistics are displayed
* [ ] Status categories are distinguishable
* [ ] Librarian can drill into each category
* [ ] Inventory records can be filtered
* [ ] Data can be refreshed
* [ ] Loading/error states are supported

---

# US-25 — Misplaced Books

**Route:** `/librarian/misplaced-books`

**As a** librarian,
**I want** to see books detected in incorrect locations,
**so that** I can return them to their assigned shelves.

### Example

```text
Expected:
Computer Science
Rack CS02
Shelf 04

Detected:
Engineering
Rack E03
Shelf 02
```

### Acceptance Criteria

* [ ] Book is identified
* [ ] Expected location is shown
* [ ] Detected location is shown
* [ ] Difference is obvious
* [ ] Librarian can mark issue as resolved
* [ ] Resolution updates status
* [ ] Unresolved items remain visible

---

# US-26 — Smart/RFID Monitoring

**Route:** `/librarian/smart-monitoring`

**As a** librarian,
**I want** to monitor RFID events,
**so that** I can identify book movements and potential misplaced books.

### Dashboard

```text
Readers Online
Books Detected
Misplaced Books
Unknown Tags
```

### Acceptance Criteria

* [ ] Reader/device status is displayed
* [ ] Recent events are displayed
* [ ] Book tag can be associated with a physical book
* [ ] Detected location is displayed
* [ ] Unexpected location can generate a misplaced status
* [ ] Offline/unavailable readers are clearly indicated
* [ ] Live/polling data does not break the interface

For the first frontend version, **mock RFID events can be used** if the hardware/API is not yet available.

---

# US-27 — Reports

**Route:** `/librarian/reports`

**As a** librarian,
**I want** to view library statistics,
**so that** I can understand library usage and operational performance.

### Reports

```text
Most Borrowed Books
Most Active Students
Overdue Books
Missing Books
Misplaced Books
Inventory
Books by Category
Monthly Borrowing
```

### Acceptance Criteria

* [ ] Reports can be selected
* [ ] Charts/tables display correctly
* [ ] Date ranges can be selected where required
* [ ] Empty datasets are handled
* [ ] Loading states exist
* [ ] Data labels are understandable

---

# 19. ADMIN PORTAL

# US-28 — Admin Dashboard

**Route:** `/admin/dashboard`

**As an** administrator,
**I want** to see system-wide statistics,
**so that** I can monitor the library platform.

### Acceptance Criteria

* [ ] User statistics displayed
* [ ] Book statistics displayed
* [ ] Librarian statistics displayed
* [ ] System activity summarized
* [ ] Critical issues highlighted
* [ ] Administrative navigation available

---

# US-29 — User Management

**Route:** `/admin/users`

**As an** administrator,
**I want** to manage users,
**so that** library accounts remain controlled and accurate.

### Acceptance Criteria

* [ ] Users can be searched
* [ ] Users can be filtered
* [ ] User status is displayed
* [ ] User details can be viewed
* [ ] Appropriate administrative actions are available
* [ ] Destructive actions require confirmation

---

# US-30 — Librarian Management

**Route:** `/admin/librarians`

**As an** administrator,
**I want** to manage librarian accounts and permissions,
**so that** library operations are properly controlled.

### Acceptance Criteria

* [ ] Librarians are listed
* [ ] Status is visible
* [ ] Details can be viewed
* [ ] Permissions/roles can be managed according to backend rules
* [ ] Sensitive actions require confirmation

---

# US-31 — Admin Library Management

**Route:** `/admin/library`

**As an** administrator,
**I want** to manage the overall library structure,
**so that** the system accurately represents the physical library.

### Acceptance Criteria

* [ ] Floors can be viewed
* [ ] Sections can be viewed
* [ ] Racks can be viewed
* [ ] Shelves can be viewed
* [ ] Administrative actions respect permissions
* [ ] Dependency relationships are preserved

---

# US-32 — System Logs

**Route:** `/admin/logs`

**As an** administrator,
**I want** to view system activity logs,
**so that** I can monitor important actions.

### Possible events

```text
User Login
Book Added
Book Deleted
Book Updated
Borrowing Created
Book Returned
Shelf Updated
Inventory Event
RFID Event
```

### Acceptance Criteria

* [ ] Events display timestamp
* [ ] Actor/user is identified where appropriate
* [ ] Action is identifiable
* [ ] Logs can be filtered
* [ ] Logs can be paginated
* [ ] Sensitive information isn't unnecessarily exposed

---

# US-33 — Settings

**Route:** `/admin/settings`

**As an** administrator,
**I want** to configure system settings,
**so that** the library platform operates according to institutional rules.

### Acceptance Criteria

* [ ] Available settings are grouped logically
* [ ] Current values are displayed
* [ ] Changes are validated
* [ ] Save operation provides feedback
* [ ] Unauthorized settings cannot be changed

---

# 20. Cross-Cutting Frontend User Stories

These are extremely important and should become **global frontend requirements**.

## US-CROSS-01 — Responsive Design

**As a** user,
**I want** the system to work on different screen sizes,
**so that** I can use it from desktops, laptops, tablets, and phones.

### Acceptance Criteria

* [ ] Desktop layout works
* [ ] Tablet layout works
* [ ] Mobile layout works
* [ ] Navigation adapts
* [ ] Tables remain usable
* [ ] Forms don't overflow
* [ ] Buttons remain accessible
* [ ] No horizontal scrolling except where intentionally designed

---

# US-CROSS-02 — Authentication & Route Protection

**As a** system user,
**I want** protected pages to require appropriate authentication,
**so that** unauthorized users cannot access restricted functionality.

### Acceptance Criteria

* [ ] Student cannot access librarian routes
* [ ] Student cannot access admin routes
* [ ] Librarian cannot access admin-only routes
* [ ] Unauthenticated users are redirected to login
* [ ] Authenticated users don't unnecessarily see login pages
* [ ] Session expiration is handled

---

# US-CROSS-03 — API Error Handling

**As a** user,
**I want** meaningful feedback when something fails,
**so that** I understand what happened.

### Acceptance Criteria

* [ ] Network errors display appropriate feedback
* [ ] Validation errors appear beside relevant fields
* [ ] Server errors have user-friendly messages
* [ ] Retry options exist where appropriate
* [ ] Errors don't crash the entire application

---

# US-CROSS-04 — Form Validation

All forms must validate before submission.

### Acceptance Criteria

* [ ] Required fields are enforced
* [ ] Invalid values are rejected
* [ ] Errors are understandable
* [ ] Validation happens at appropriate times
* [ ] Backend validation errors can be displayed

---

# US-CROSS-05 — Accessibility

**As a** user with accessibility needs,
**I want** the application to be accessible,
**so that** I can use the library system effectively.

### Acceptance Criteria

* [ ] Keyboard navigation works
* [ ] Form controls have labels
* [ ] Images have appropriate alternative text
* [ ] Focus states are visible
* [ ] Color isn't the only indicator of status
* [ ] Modals manage focus appropriately
* [ ] Semantic HTML is used

---

# 21. Component-to-Page Mapping

This is useful for assigning development tasks.

| Component      | Used By                       |
| -------------- | ----------------------------- |
| Navbar         | Public + Student              |
| Sidebar        | Librarian + Admin             |
| SearchBar      | Home + Search                 |
| BookCard       | Home + Search                 |
| BookTable      | Librarian + Admin             |
| StatusBadge    | Almost all dashboards         |
| Modal          | Management pages              |
| ConfirmDialog  | Delete/return/cancel actions  |
| Toast          | Almost all pages              |
| Pagination     | Search, history, tables, logs |
| Breadcrumb     | Management pages              |
| Input          | Forms                         |
| Select         | Filters/forms                 |
| LoadingSpinner | API-driven pages              |
| EmptyState     | Search/dashboards/lists       |
| Charts         | Dashboard/reports             |

---

# 22. Recommended Frontend Ticket Structure

Don't give developers a ticket saying:

> "Build librarian dashboard."

That's too broad.

Break it down like this:

```text
LIB-001
Create librarian layout

LIB-002
Create librarian sidebar

LIB-003
Create dashboard statistic cards

LIB-004
Create recent borrowing component

LIB-005
Create inventory summary component

LIB-006
Connect dashboard statistics API

LIB-007
Add loading state

LIB-008
Add dashboard error state

LIB-009
Make dashboard responsive

LIB-010
Test dashboard permissions
```

This makes GitHub/Jira/Trello management much easier.

---

# 23. Definition of Done

A frontend story should **not** be considered complete simply because "the page looks finished."

Every story should satisfy:

```text
UI implemented
       ↓
Responsive
       ↓
Loading state
       ↓
Empty state
       ↓
Error state
       ↓
Form validation
       ↓
API integrated
       ↓
Authentication checked
       ↓
Accessibility checked
       ↓
Tested
       ↓
Code reviewed
       ↓
Merged
```

---

# 24. MVP Priority

If your team has limited time, **do not build every feature simultaneously**.

### Priority 1 — Core Library Search

```text
Home
   ↓
Search
   ↓
Search Results
   ↓
Book Details
   ↓
Book Location
```

### Priority 2 — Authentication

```text
Login
Register
Forgot Password
Role-based routing
```

### Priority 3 — Student

```text
Dashboard
Borrowed Books
Reservations
History
Profile
```

### Priority 4 — Librarian

```text
Dashboard
Books
Book Copies
Shelves
Racks
Borrowings
Returns
Reservations
```

### Priority 5 — Smart Library

```text
Inventory
Misplaced Books
RFID Monitoring
Reports
```

### Priority 6 — Administration

```text
Admin Dashboard
Users
Librarians
Library Structure
Logs
Settings
```

---

# 25. Most Important End-to-End Acceptance Test

Your frontend team should eventually be able to demonstrate this entire scenario:

```text
STUDENT
  │
  ├── Opens ABSU Smart Library
  │
  ├── Searches "Database Systems"
  │
  ├── Sees search results
  │
  ├── Opens book
  │
  ├── Sees "Available"
  │
  ├── Clicks "Locate Book"
  │
  ├── System displays:
  │      Floor 1
  │      Computer Science
  │      Rack CS02
  │      Shelf 04
  │
  ├── Student finds book
  │
  ├── Borrows book
  │
  └── Dashboard updates
          │
          ├── Borrowed: +1
          └── Available copies: -1
```

Then the librarian side:

```text
LIBRARIAN
   │
   ├── Sees borrowing transaction
   │
   ├── Book is returned
   │
   ├── Copy becomes AVAILABLE
   │
   ├── Inventory updates
   │
   └── RFID system detects physical location
                │
                ├── Correct → Verified
                │
                └── Wrong → Misplaced
```
