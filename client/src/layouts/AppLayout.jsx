import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell, LogOut } from 'lucide-react';
import Sidebar from '../components/navigation/Sidebar';
import { useAuth } from '../context/useAuth';
import './Layouts.css';

function AppLayout({ role: roleProp }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const role = roleProp || user?.role || 'librarian';

  useEffect(() => {
    if (!sidebarOpen) return;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [sidebarOpen]);

  const TITLES = {
    '/student/dashboard': 'Student Dashboard',
    '/student/borrowings': 'My Borrowings',
    '/student/reservations': 'My Reservations',
    '/student/fines': 'My Fines',
    '/student/profile': 'My Profile',
    '/librarian/dashboard': 'Librarian Dashboard',
    '/librarian/books': 'Books',
    '/librarian/books/add': 'Add Book',
    '/librarian/books/import': 'Bulk Book Import',
    '/librarian/book-copies': 'Book Copies',
    '/librarian/borrowings': 'Borrowings',
    '/librarian/reservations': 'Reservations',
    '/librarian/renewals': 'Renewals',
    '/librarian/fines': 'Fines',
    '/librarian/stock-verification': 'Stock Verification',
    '/librarian/notifications': 'Notifications',
    '/librarian/shelves': 'Shelf Management',
    '/librarian/pillars': 'Physical Pillar Map',
    '/librarian/inventory': 'Inventory',
    '/librarian/misplaced-books': 'Misplaced Books',
    '/librarian/reports': 'Reports',
    '/librarian/profile': 'My Profile',
    '/admin/dashboard': 'Admin Dashboard',
    '/admin/users': 'User Management',
    '/admin/students': 'Students',
    '/admin/students/import': 'Students',
    '/admin/librarians': 'Librarian Management',
    '/admin/library': 'Library Structure',
    '/admin/books': 'Books',
    '/admin/books/new': 'Add Book',
    '/admin/book-copies': 'Book Copies',
    '/admin/shelves': 'Shelf Management',
    '/admin/pillars': 'Physical Pillar Map',
    '/admin/logs': 'System Logs',
    '/admin/settings': 'Settings',
    '/admin/notifications': 'Notifications',
    '/admin/borrowings': 'Borrowings',
    '/admin/reservations': 'Reservations',
    '/admin/renewals': 'Renewals',
    '/admin/fines': 'Fines',
    '/admin/inventory': 'Inventory',
    '/admin/stock-verification': 'Stock Verification',
    '/admin/misplaced-books': 'Misplaced Books',
    '/admin/books/import': 'Bulk Book Import',
    '/admin/profile': 'My Profile',
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (TITLES[path]) return TITLES[path];
    if (path.startsWith('/librarian/books/') || path.startsWith('/admin/books/')) {
      if (path.endsWith('/edit')) return 'Edit Book';
      if (path.endsWith('/copies')) return 'Book Copies';
    }
    return 'Dashboard';
  };

  const getInitials = (userObj) => {
    if (!userObj) return '?';
    const name =
      userObj.name ||
      [userObj.first_name, userObj.last_name].filter(Boolean).join(' ');
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserName = (userObj) => {
    if (!userObj) return '';
    return (
      userObj.name ||
      [userObj.first_name, userObj.last_name].filter(Boolean).join(' ')
    );
  };

  return (
    <div className="layout-admin">
      <Sidebar
        role={role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
      />

      <div className="layout-admin__main">
        <header className="layout-admin__header">
          <div className="layout-admin__header-left">
            <button
              className="layout-admin__toggle-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
            <h1 className="layout-admin__title">{getPageTitle()}</h1>
          </div>

          <div className="layout-admin__header-right">
            <button
              className="layout-admin__notif-btn"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="layout-admin__notif-badge" />
            </button>

            <div className="layout-admin__header-user">
              <span className="layout-admin__header-avatar">
                {getInitials(user)}
              </span>
              <div className="layout-admin__header-user-text">
                <div className="layout-admin__header-name">
                  {getUserName(user)}
                </div>
                <div className="layout-admin__header-role">{role.charAt(0).toUpperCase() + role.slice(1)}</div>
              </div>
            </div>

            <button
              className="layout-admin__header-icon-btn"
              onClick={logout}
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="layout-admin__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
