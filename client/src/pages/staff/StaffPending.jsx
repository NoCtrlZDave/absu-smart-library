import { useNavigate, Link } from 'react-router-dom';
import { Clock, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import absuLogo from '../../assets/ABSU-logo-mark.png';
import './StaffPending.css';

const StaffPending = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="pending-page">
      <div className="pending-card">
        <div className="pending-logo">
          <img src={absuLogo} alt="ABSU" className="pending-logo-img" />
          <span className="pending-logo-text">
            ABSU
            <span className="pending-logo-sub">Smart Library</span>
          </span>
        </div>

        <div className="pending-icon">
          <Clock size={32} />
        </div>

        <h1 className="pending-title">Account Pending Verification</h1>
        <p className="pending-desc">
          Thanks, <strong>{user?.first_name} {user?.last_name}</strong>. Your staff account has
          been submitted for review. The library administrator will verify your identity
          before your portal is activated.
        </p>

        <div className="pending-details">
          <div className="pending-detail-row">
            <span className="pending-detail-label">Name</span>
            <span className="pending-detail-value">{user?.first_name} {user?.last_name}</span>
          </div>
          <div className="pending-detail-row">
            <span className="pending-detail-label">Email</span>
            <span className="pending-detail-value">{user?.email}</span>
          </div>
          <div className="pending-detail-row">
            <span className="pending-detail-label">Staff Type</span>
            <span className="pending-detail-value">
              {user?.staffType === 'teaching' ? 'Teaching' : 'Non-teaching'}
            </span>
          </div>
          <div className="pending-detail-row">
            <span className="pending-detail-label">Status</span>
            <span className="pending-status-badge">Pending</span>
          </div>
        </div>

        <p className="pending-note">
          Refresh this page after approval, or contact the library office if this takes too long.
        </p>

        <div className="pending-actions">
          <Link to="/" className="pending-btn pending-btn-outline">
            <ArrowLeft size={16} />
            Back to Website
          </Link>
          <button type="button" className="pending-btn pending-btn-danger" onClick={handleLogout}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffPending;
