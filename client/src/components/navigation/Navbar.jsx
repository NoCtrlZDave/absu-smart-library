import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown, LayoutDashboard, Settings } from 'lucide-react';
import absuLogo from '../../assets/ABSU-logo-mark.png';
import './Navigation.css';

function Navbar({ user = null, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMenus = () => {
    setMobileOpen(false);
    setDropdownOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const links = [
    { to: '/', label: 'Home' },
    { to: '/search', label: 'Search' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  const getInitials = (userObj) => {
    if (!userObj) return '?';
    const name = userObj.name || [userObj.first_name, userObj.last_name].filter(Boolean).join(' ');
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
    return userObj.name || [userObj.first_name, userObj.last_name].filter(Boolean).join(' ');
  };

  const getDashboardPath = (userObj) => {
    if (userObj?.role === 'admin') return '/admin/dashboard';
    return '/librarian/dashboard';
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar__brand">
          <img src={absuLogo} alt="ABSU logo" className="navbar__brand-logo" />
          <span className="navbar__brand-text">
            ABSU
            <span className="navbar__brand-sub">Smart Library</span>
          </span>
        </Link>

        <div className="navbar__links">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={closeMenus}
              className={`navbar__link ${isActive(link.to) ? 'navbar__link--active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="navbar__actions">
          {user ? (
            <div className="navbar__user" ref={dropdownRef}>
              <button
                className="navbar__user-btn"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <span className="navbar__user-avatar">
                  {getInitials(user)}
                </span>
                <span>{getUserName(user)}</span>
                <ChevronDown size={14} />
              </button>

              {dropdownOpen && (
                <div className="navbar__dropdown">
                  <Link
                    to={getDashboardPath(user)}
                    className="navbar__dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                  <button
                    className="navbar__dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  <div className="navbar__dropdown-divider" />
                  <button
                    className="navbar__dropdown-item navbar__dropdown-item--danger"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout?.();
                    }}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="navbar__auth-btn navbar__auth-btn--outline">
                Login
              </Link>
            </>
          )}

          <button
            className="navbar__mobile-toggle"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <div className={`navbar__mobile-menu ${mobileOpen ? 'navbar__mobile-menu--open' : ''}`}>
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            onClick={closeMenus}
            className={`navbar__mobile-link ${isActive(link.to) ? 'navbar__mobile-link--active' : ''}`}
          >
            {link.label}
          </Link>
        ))}

        <div className="navbar__mobile-actions">
          {user ? (
            <>
              <Link to={getDashboardPath(user)} className="navbar__mobile-link" onClick={closeMenus}>
                <User size={16} style={{ marginRight: 8 }} />
                Dashboard
              </Link>
              <button
                className="navbar__mobile-link"
                onClick={onLogout}
                style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
              >
                <LogOut size={16} style={{ marginRight: 8 }} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__auth-btn navbar__auth-btn--outline" style={{ textAlign: 'center' }}>
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;
