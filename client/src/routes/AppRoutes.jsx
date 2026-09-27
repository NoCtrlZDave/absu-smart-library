import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Spinner from '../components/common/Spinner';
import ProtectedRoute from './ProtectedRoute';

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

// Shared
const ProfilePage = React.lazy(() => import('../pages/ProfilePage'));
const PillarMapPage = React.lazy(() => import('../pages/PillarMapPage'));
const LibraryPhotos = React.lazy(() => import('../pages/LibraryPhotos'));

// Librarian Pages
const LibrarianDashboard = React.lazy(() => import('../pages/librarian/LibrarianDashboard'));
const BooksManagement = React.lazy(() => import('../pages/librarian/BooksManagement'));
const AddBook = React.lazy(() => import('../pages/librarian/AddBook'));
const BookCopies = React.lazy(() => import('../pages/librarian/BookCopies'));
const ShelfManagement = React.lazy(() => import('../pages/librarian/ShelfManagement'));
const Inventory = React.lazy(() => import('../pages/librarian/Inventory'));
const MisplacedBooks = React.lazy(() => import('../pages/librarian/MisplacedBooks'));
const Reports = React.lazy(() => import('../pages/librarian/Reports'));

// Admin Pages
const AdminDashboard = React.lazy(() => import('../pages/admin/AdminDashboard'));
const UserManagement = React.lazy(() => import('../pages/admin/UserManagement'));
const LibrarianManagement = React.lazy(() => import('../pages/admin/LibrarianManagement'));
const LibraryStructure = React.lazy(() => import('../pages/admin/LibraryStructure'));
const SystemLogs = React.lazy(() => import('../pages/admin/SystemLogs'));
const Settings = React.lazy(() => import('../pages/admin/Settings'));

const AppRoutes = () => {
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
          <Route path="/librarian/photos" element={<LibraryPhotos basePath="/librarian" />} />
          <Route path="/librarian/pillars" element={<PillarMapPage />} />
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
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/librarians" element={<LibrarianManagement />} />
          <Route path="/admin/library" element={<LibraryStructure />} />
          <Route path="/admin/books" element={<BooksManagement basePath="/admin" />} />
          <Route path="/admin/books/new" element={<AddBook basePath="/admin" />} />
          <Route path="/admin/books/:id/edit" element={<AddBook basePath="/admin" />} />
          <Route path="/admin/books/:id/copies" element={<BookCopies basePath="/admin" />} />
          <Route path="/admin/book-copies" element={<BookCopies basePath="/admin" />} />
          <Route path="/admin/shelves" element={<ShelfManagement />} />
          <Route path="/admin/photos" element={<LibraryPhotos basePath="/admin" />} />
          <Route path="/admin/pillars" element={<PillarMapPage />} />
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