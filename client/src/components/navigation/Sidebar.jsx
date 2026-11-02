import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  BookCopy,
  Layers,
  BookMarked,
  ClipboardList,
  AlertTriangle,
  BarChart3,
  Users,
  UserCog,
  Settings,
  FileText,
  Globe,
  UserRound,
  ChevronUp,
  LogOut,
  Map,
  Image as ImageIcon,
  Search,
  BookOpen,
  RefreshCw,
  CircleDollarSign,
  ScanLine,
  Upload,
  BellRing,
  ShieldCheck,
  GraduationCap,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import absuLogo from '../../assets/ABSU-logo-mark.png';
import './Navigation.css';

const librarianLinks = [
  {
    section: 'Overview',
    items: [
      { to: '/librarian/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ],
  },
  {
    section: 'Catalogue',
    items: [
      { to: '/librarian/books', icon: BookMarked, label: 'Books' },
      { to: '/librarian/book-copies', icon: BookCopy, label: 'Book Copies' },
      { to: '/librarian/books/import', icon: Upload, label: 'Bulk Book Import' },
      { to: '/librarian/shelves', icon: Layers, label: 'Shelves' },
      { to: '/librarian/pillars', icon: Map, label: 'Pillar Map' },
      { to: '/librarian/photos', icon: ImageIcon, label: 'Library Photos' },
    ],
  },
  {
    section: 'Circulation',
    items: [
      { to: '/librarian/borrowings', icon: BookOpen, label: 'Borrowings' },
      { to: '/librarian/reservations', icon: ClipboardList, label: 'Reservations' },
      { to: '/librarian/renewals', icon: RefreshCw, label: 'Renewals' },
      { to: '/librarian/fines', icon: CircleDollarSign, label: 'Fines' },
    ],
  },
  {
    section: 'Smart System',
    items: [
      { to: '/librarian/inventory', icon: ClipboardList, label: 'Inventory' },
      { to: '/librarian/stock-verification', icon: ScanLine, label: 'Stock Verification' },
      { to: '/librarian/misplaced-books', icon: AlertTriangle, label: 'Misplaced Books' },
    ],
  },
  {
    section: 'Reports',
    items: [
      { to: '/librarian/reports', icon: BarChart3, label: 'Reports' },
      { to: '/librarian/catalogue-spreadsheet', icon: FileSpreadsheet, label: 'Catalogue Spreadsheet' },
      { to: '/librarian/notifications', icon: BellRing, label: 'Notifications' },
      { to: '/librarian/profile', icon: UserRound, label: 'Profile' },
    ],
  },
  {
    section: 'IT Operations',
    items: [
      { to: '/librarian/it-dashboard', icon: ShieldCheck, label: 'IT Dashboard' },
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
      { to: '/admin/students', icon: GraduationCap, label: 'Students' },
      { to: '/admin/librarians', icon: UserCog, label: 'Librarians' },
    ],
  },
  {
    section: 'Library',
    items: [
      { to: '/admin/books', icon: BookMarked, label: 'Books' },
      { to: '/admin/book-copies', icon: BookCopy, label: 'Book Copies' },
      { to: '/admin/shelves', icon: Layers, label: 'Shelves' },
      { to: '/admin/photos', icon: ImageIcon, label: 'Library Photos' },
      { to: '/admin/pillars', icon: Map, label: 'Pillar Map' },
      { to: '/admin/library', icon: FileText, label: 'Library Structure' },
      { to: '/admin/books/import', icon: Upload, label: 'Bulk Book Import' },
    ],
  },
  {
    section: 'Circulation',
    items: [
      { to: '/admin/borrowings', icon: BookOpen, label: 'Borrowings' },
      { to: '/admin/reservations', icon: ClipboardList, label: 'Reservations' },
      { to: '/admin/renewals', icon: RefreshCw, label: 'Renewals' },
      { to: '/admin/fines', icon: CircleDollarSign, label: 'Fines' },
      { to: '/admin/inventory', icon: ClipboardList, label: 'Inventory' },
      { to: '/admin/stock-verification', icon: ScanLine, label: 'Stock Verification' },
      { to: '/admin/misplaced-books', icon: AlertTriangle, label: 'Misplaced Books' },
    ],
  },
  {
    section: 'System',
    items: [
      { to: '/admin/logs', icon: FileText, label: 'Logs' },
      { to: '/admin/notifications', icon: BellRing, label: 'Notifications' },
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
      { to: '/admin/profile', icon: UserRound, label: 'Profile' },
    ],
  },
];

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
      { to: '/student/borrowings', icon: BookOpen, label: 'My Borrowings' },
      { to: '/student/reservations', icon: ClipboardList, label: 'My Reservations' },
      { to: '/student/fines', icon: CircleDollarSign, label: 'My Fines' },
      { to: '/student/profile', icon: UserRound, label: 'Profile' },
    ],
  },
];

const staffLinks = librarianLinks;

const ROLE_LINKS = {
  student: studentLinks,
  librarian: librarianLinks,
  assistant_librarian: staffLinks,
  circulation_staff: staffLinks,
  it_librarian: staffLinks,
  admin: adminLinks,
};

const PROFILE_PATH = {
  student: '/student/profile',
  librarian: '/librarian/profile',
  assistant_librarian: '/librarian/profile',
  circulation_staff: '/librarian/profile',
  it_librarian: '/librarian/profile',
  admin: '/admin/profile',
};

function Sidebar({ role = 'librarian', isOpen, onClose, user }) {
  const sections = ROLE_LINKS[role] || librarianLinks;
  const profilePath = PROFILE_PATH[role] || '/librarian/profile';
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
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} aria-label="Main navigation">
        <button className="sidebar__close" onClick={onClose} aria-label="Close sidebar">
          <X size={18} />
        </button>

        <Link to="/" className="sidebar__brand">
          <img src={absuLogo} alt="ABSU logo" className="sidebar__brand-logo" />
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
                <span className="sidebar__user-role">{role}</span>
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