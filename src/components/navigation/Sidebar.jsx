import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  X,
  LayoutDashboard,
  BookCopy,
  Layers,
  BookMarked,
  RotateCcw,
  CalendarCheck,
  ClipboardList,
  AlertTriangle,
  BarChart3,
  Users,
  UserCog,
  Settings,
  FileText,
  Search,
  History,
  Bell,
  UserCircle,
  UserRound,
  ChevronUp,
  Globe,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import './Navigation.css';

const studentLinks = [
  {
    section: 'Overview',
    items: [
      { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ],
  },
  {
    section: 'Library',
    items: [
      { to: '/search', icon: Search, label: 'Search Books' },
      { to: '/student/borrowed-books', icon: BookMarked, label: 'Borrowed Books' },
      { to: '/student/reservations', icon: CalendarCheck, label: 'Reservations' },
      { to: '/student/history', icon: History, label: 'History' },
    ],
  },
  {
    section: 'Account',
    items: [
      { to: '/student/profile', icon: UserCircle, label: 'Profile' },
      { to: '/student/notifications', icon: Bell, label: 'Notifications' },
    ],
  },
];

const librarianLinks = [
  {
    section: 'Overview',
    items: [
      { to: '/librarian/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ],
  },
  {
    section: 'Library',
    items: [
      { to: '/librarian/books', icon: BookMarked, label: 'Books' },
      { to: '/librarian/book-copies', icon: BookCopy, label: 'Book Copies' },
      { to: '/librarian/shelves', icon: Layers, label: 'Shelves' },
    ],
  },
  {
    section: 'Circulation',
    items: [
      { to: '/librarian/borrowings', icon: BookCopy, label: 'Borrowings' },
      { to: '/librarian/returns', icon: RotateCcw, label: 'Returns' },
      { to: '/librarian/reservations', icon: CalendarCheck, label: 'Reservations' },
    ],
  },
  {
    section: 'Smart System',
    items: [
      { to: '/librarian/inventory', icon: ClipboardList, label: 'Inventory' },
      { to: '/librarian/misplaced-books', icon: AlertTriangle, label: 'Misplaced Books' },
    ],
  },
  {
    section: 'Reports',
    items: [
      { to: '/librarian/reports', icon: BarChart3, label: 'Reports' },
      { to: '/librarian/profile', icon: UserRound, label: 'Profile' },
    ],
  },
];

const adminLinks = [
  {
    section: 'Overview',
    items: [
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ],
  },
  {
    section: 'Users',
    items: [
      { to: '/admin/users', icon: Users, label: 'Users' },
      { to: '/admin/librarians', icon: UserCog, label: 'Librarians' },
    ],
  },
  {
    section: 'Library',
    items: [
      { to: '/librarian/books', icon: BookMarked, label: 'Books' },
      { to: '/librarian/book-copies', icon: BookCopy, label: 'Book Copies' },
      { to: '/librarian/shelves', icon: Layers, label: 'Shelves' },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/admin/logs', icon: FileText, label: 'Logs' },
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
      { to: '/admin/profile', icon: UserRound, label: 'Profile' },
    ],
  },
];

const ROLE_LINKS = {
  student: studentLinks,
  librarian: librarianLinks,
  admin: adminLinks,
};

const PROFILE_PATH = {
  student: '/student/profile',
  librarian: '/librarian/profile',
  admin: '/admin/profile',
};

function Sidebar({ role = 'librarian', isOpen, onClose, user }) {
  const sections = ROLE_LINKS[role] || librarianLinks;
  const profilePath = PROFILE_PATH[role] || '/student/profile';
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose?.();
    navigate('/login');
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
    <>
      <div
        className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <button className="sidebar__close" onClick={onClose} aria-label="Close sidebar">
          <X size={18} />
        </button>

        <Link to="/" className="sidebar__brand">
          <BookOpen size={24} strokeWidth={2.2} />
          <span className="sidebar__brand-text">
            ABSU
            <span className="sidebar__brand-sub">Smart Library</span>
          </span>
        </Link>

        <nav className="sidebar__nav">
          {sections.map((section) => (
            <div key={section.section} className="sidebar__section">
              <div className="sidebar__section-title">{section.section}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                  }
                  onClick={onClose}
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {user && (
          <div className="sidebar__footer">
            <Link to="/" className="sidebar__footer-action" onClick={onClose}>
              <Globe size={16} />
              Back to Website
            </Link>
            <button
              className="sidebar__footer-action sidebar__footer-action--danger"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Logout
            </button>
            <div className="sidebar__footer-divider" />
            <Link to={profilePath} className="sidebar__user" onClick={onClose}>
              <span className="sidebar__user-avatar">{getInitials(user)}</span>
              <span className="sidebar__user-info">
                <span className="sidebar__user-name">{getUserName(user)}</span>
                <span className="sidebar__user-role">{user.role}</span>
              </span>
              <ChevronUp size={14} style={{ opacity: 0.5 }} />
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;

