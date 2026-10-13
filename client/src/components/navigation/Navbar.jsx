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
  const mobileToggleRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape closes whichever menu is open and returns focus to the trigger.
  useEffect(() => {
    if (!mobileOpen && !dropdownOpen) return undefined;

    function handleKeyDown(e) {
      if (e.key !== 'Escape') return;
      if (mobileOpen) {
        setMobileOpen(false);
        mobileToggleRef.current?.focus();
      }
      setDropdownOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, dropdownOpen]);

  // The panel is fixed with its own scroll area, so lock the page behind it
  // to stop touch scrolling the backdrop while the menu is up.
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  // Navigating away (including browser back/forward) must not leave the
  // panel open over the new page.
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Close the panel if the viewport grows past the mobile breakpoint,
  // otherwise it would stay stuck open on desktop with no toggle visible.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 901px)');
    function handleChange(e) {
      if (e.matches) setMobileOpen(false);
    }
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
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
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
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
            ref={mobileToggleRef}
            className="navbar__mobile-toggle"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="navbar-mobile-menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <div
        id="navbar-mobile-menu"
        className={`navbar__mobile-menu ${mobileOpen ? 'navbar__mobile-menu--open' : ''}`}
        hidden={!mobileOpen}
      >
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
