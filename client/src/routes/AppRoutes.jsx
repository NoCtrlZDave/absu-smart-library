import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Spinner from '../components/common/Spinner';
import ProtectedRoute from './ProtectedRoute';
import { PasswordGate, StaffGate } from './PortalGates';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AppLayout from '../layouts/AppLayout';

// Public Pages
const Home = React.lazy(() => import('../pages/public/Home'));
const Search = React.lazy(() => import('../pages/public/Search'));
const BookDetails = React.lazy(() => import('../pages/public/BookDetails'));
const BookLocation = React.lazy(() => import('../pages/public/BookLocation'));
const About = React.lazy(() => import('../pages/public/About'));
const Contact = React.lazy(() => import('../pages/public/Contact'));
const Login = React.lazy(() => import('../pages/auth/Login'));
const StaffSignup = React.lazy(() => import('../pages/auth/StaffSignup'));
const ForcePasswordChange = React.lazy(() => import('../pages/auth/ForcePasswordChange'));

// Student Pages
const StudentDashboard = React.lazy(() => import('../pages/student/StudentDashboard'));
const BorrowedBooks = React.lazy(() => import('../pages/student/BorrowedBooks'));
const StudentReservations = React.lazy(() => import('../pages/student/Reservations'));
const History = React.lazy(() => import('../pages/student/History'));
const ProfilePage = React.lazy(() => import('../pages/ProfilePage'));

// Staff Pages
const StaffDashboard = React.lazy(() => import('../pages/staff/StaffDashboard'));
const StaffPending = React.lazy(() => import('../pages/staff/StaffPending'));

// Librarian Pages
const LibrarianDashboard = React.lazy(() => import('../pages/librarian/LibrarianDashboard'));
const BooksManagement = React.lazy(() => import('../pages/librarian/BooksManagement'));
const AddBook = React.lazy(() => import('../pages/librarian/AddBook'));
const BookCopies = React.lazy(() => import('../pages/librarian/BookCopies'));
const ShelfManagement = React.lazy(() => import('../pages/librarian/ShelfManagement'));
const Borrowings = React.lazy(() => import('../pages/librarian/Borrowings'));
const Returns = React.lazy(() => import('../pages/librarian/Returns'));
const ReservationsManagement = React.lazy(() => import('../pages/librarian/ReservationsManagement'));
const Inventory = React.lazy(() => import('../pages/librarian/Inventory'));
const MisplacedBooks = React.lazy(() => import('../pages/librarian/MisplacedBooks'));
const Reports = React.lazy(() => import('../pages/librarian/Reports'));

// Admin Pages
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const AcademicSectionPage = React.lazy(() => import('../pages/admin/AcademicSectionPage'));
const StudentManagement = React.lazy(() => import('../pages/admin/StudentManagement'));
const UserManagement = React.lazy(() => import('../pages/admin/UserManagement'));
const LibrarianManagement = React.lazy(() => import('../pages/admin/LibrarianManagement'));
const StaffVerification = React.lazy(() => import('../pages/admin/StaffVerification'));
const LibraryStructure = React.lazy(() => import('../pages/admin/LibraryStructure'));
const SystemLogs = React.lazy(() => import('../pages/admin/SystemLogs'));
const Settings = React.lazy(() => import('../pages/admin/Settings'));

const AppRoutes = () => {
  const requirePasswordChange = (element) => (
    <PasswordGate>{element}</PasswordGate>
  );

  const gateStaff = (element) => (
    <StaffGate>{element}</StaffGate>
  );

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/books/:id" element={<BookDetails />} />
          <Route path="/books/:id/location" element={<BookLocation />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/staff/signup" element={<StaffSignup />} />
          <Route path="/register" element={<Navigate to="/staff/signup" replace />} />
        </Route>

        {/* Forced password change (authenticated, standalone) */}
        <Route
          path="/force-password-change"
          element={
            <ProtectedRoute roles={['student', 'staff']} skipGates>
              <ForcePasswordChange />
            </ProtectedRoute>
          }
        />

        {/* Staff pending (authenticated, standalone) */}
        <Route
          path="/staff/pending"
          element={
            <ProtectedRoute roles={['staff']} skipGates>
              <StaffPending />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          element={
            <ProtectedRoute roles={['student', 'staff']}>
              {requirePasswordChange(
                <AppLayout role="student" />
              )}
            </ProtectedRoute>
          }
        >
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/borrowed-books" element={<BorrowedBooks />} />
          <Route path="/student/reservations" element={<StudentReservations />} />
          <Route path="/student/history" element={<History />} />
          <Route path="/student/profile" element={<ProfilePage />} />
        </Route>

        {/* Staff Routes */}
        <Route
          element={
            <ProtectedRoute roles={['staff']}>
              {requirePasswordChange(
                gateStaff(<AppLayout role="staff" />)
              )}
            </ProtectedRoute>
          }
        >
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/borrowed-books" element={<BorrowedBooks />} />
          <Route path="/staff/reservations" element={<StudentReservations />} />
          <Route path="/staff/history" element={<History />} />
          <Route path="/staff/profile" element={<ProfilePage />} />
        </Route>

        {/* Librarian Routes */}
        <Route
          element={
            <ProtectedRoute roles={['librarian', 'admin']}>
              <AppLayout role="librarian" />
            </ProtectedRoute>
          }
        >
          <Route path="/librarian/dashboard" element={<LibrarianDashboard />} />
          <Route path="/librarian/books" element={<BooksManagement basePath="/librarian" />} />
          <Route path="/librarian/books/add" element={<AddBook basePath="/librarian" />} />
          <Route path="/librarian/books/:id/edit" element={<AddBook basePath="/librarian" />} />
          <Route path="/librarian/books/:id/copies" element={<BookCopies basePath="/librarian" />} />
          <Route path="/librarian/book-copies" element={<BookCopies basePath="/librarian" />} />
          <Route path="/librarian/shelves" element={<ShelfManagement />} />
          <Route path="/librarian/borrowings" element={<Borrowings />} />
          <Route path="/librarian/returns" element={<Returns />} />
          <Route path="/librarian/reservations" element={<ReservationsManagement />} />
          <Route path="/librarian/inventory" element={<Inventory />} />
          <Route path="/librarian/misplaced-books" element={<MisplacedBooks />} />
          <Route path="/librarian/reports" element={<Reports />} />
          <Route path="/librarian/profile" element={<ProfilePage />} />
        </Route>

        {/* Admin Routes */}
        <Route
          element={
            <ProtectedRoute roles={['admin']}>
              <AppLayout role="admin" />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/academic-section" element={<AcademicSectionPage />} />
          <Route path="/admin/students" element={<StudentManagement />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/librarians" element={<LibrarianManagement />} />
          <Route path="/admin/staff-verification" element={<StaffVerification />} />
          <Route path="/admin/library" element={<LibraryStructure />} />
          <Route path="/admin/books" element={<BooksManagement basePath="/admin" />} />
          <Route path="/admin/books/new" element={<AddBook basePath="/admin" />} />
          <Route path="/admin/books/:id/edit" element={<AddBook basePath="/admin" />} />
          <Route path="/admin/books/:id/copies" element={<BookCopies basePath="/admin" />} />
          <Route path="/admin/book-copies" element={<BookCopies basePath="/admin" />} />
          <Route path="/admin/shelves" element={<ShelfManagement />} />
          <Route path="/admin/logs" element={<SystemLogs />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
