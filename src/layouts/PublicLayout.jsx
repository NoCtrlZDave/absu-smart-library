import { Outlet } from 'react-router-dom';
import Navbar from '../components/navigation/Navbar';
import { useAuth } from '../context/useAuth';
import absuLogo from '../assets/ABSU-logo-mark.png';
import './Layouts.css';

function PublicLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="layout-public">
      <Navbar user={user} onLogout={logout} />

      <main className="layout-public__main">
        <Outlet />
      </main>

      <footer className="layout-public__footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <span className="footer__brand-name">
              <img src={absuLogo} alt="ABSU logo" className="footer__brand-logo" />
              ABSU Smart Library
            </span>
            <p className="footer__brand-desc">
              A smart library book search and shelf management system
              for Abia State University.
            </p>
          </div>

          <div>
            <h4 className="footer__column-title">Quick Links</h4>
            <a href="/" className="footer__link">Home</a>
            <a href="/search" className="footer__link">Search Books</a>
            <a href="/about" className="footer__link">About</a>
          </div>

          <div>
            <h4 className="footer__column-title">Account</h4>
            <a href="/login" className="footer__link">Login</a>
            <a href="/register" className="footer__link">Register</a>
          </div>

          <div>
            <h4 className="footer__column-title">Contact</h4>
            <span className="footer__link">Abia State University</span>
            <span className="footer__link">Uturu, Abia, Nigeria</span>
          </div>
        </div>

        <div className="footer__bottom">
          <span>&copy; {new Date().getFullYear()} ABSU Smart Library. All rights reserved.</span>
          <span>Abia State University</span>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
