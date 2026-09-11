import { Link } from 'react-router-dom';
import { Activity, ArrowRight } from 'lucide-react';
import { Badge } from '../common';
import { useAudit } from '../../context/useAudit';
import './Audit.css';

const getInitials = (name) =>
  String(name || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const roleVariant = (role) => {
  if (role === 'admin') return 'danger';
  if (role === 'librarian') return 'warning';
  if (role === 'student') return 'info';
  return 'info';
};

const timeAgo = (iso) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const ActivityFeed = ({ limit = 8, linkTo = null }) => {
  const { activities } = useAudit();
  const items = activities.slice(0, limit);

  if (items.length === 0) {
    return (
      <div className="activity-empty">
        <Activity size={28} />
        <p>No changes recorded yet. Staff and admin actions will appear here.</p>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      {items.map((item) => (
        <div key={item.id} className="activity-item">
          <span className="activity-avatar">{getInitials(item.actorName)}</span>
          <div className="activity-body">
            <div className="activity-line">
              <strong>{item.actorName}</strong>
              <Badge variant={roleVariant(item.actorRole)}>
                {item.actorRole}
              </Badge>
              <span className="activity-action">{item.action}</span>
              <span className="activity-entity">{item.entity}</span>
            </div>
            <div className="activity-desc">{item.description}</div>
            <div className="activity-time">{timeAgo(item.timestamp)}</div>
          </div>
        </div>
      ))}
      {linkTo && items.length > 0 && (
        <Link to={linkTo} className="activity-more">
          View all activity <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
};

export default ActivityFeed;