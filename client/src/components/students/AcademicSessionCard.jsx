import { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';
import { Button, Input, Badge } from '../common';
import { useStudents } from '../../context/useStudent';
import { useAudit } from '../../context/useAudit';
import { parseSessionStartYear } from '../../utils/students';
import '../../pages/admin/Admin.css';

const AcademicSessionCard = ({ compact = false }) => {
  const {
    sessions,
    activeSession,
    setActiveSessionByLabel,
    addSession,
    removeSession,
  } = useStudents();
  const { audit } = useAudit();

  const [customSession, setCustomSession] = useState('');
  const [error, setError] = useState('');

  const sorted = [...sessions].sort((a, b) => a.startYear - b.startYear);
  const activeIndex = sorted.findIndex((s) => s.label === activeSession);

  const changeSession = (dir) => {
    const target = sorted[activeIndex + dir];
    if (target) {
      setActiveSessionByLabel(target.label);
      audit('Change session', 'Academic Section', `Switched active session to ${target.label}`);
    }
  };

  const handleSelectSession = (e) => {
    const label = e.target.value;
    if (label && label !== activeSession) {
      setActiveSessionByLabel(label);
      audit('Change session', 'Academic Section', `Switched active session to ${label}`);
    }
  };

  const handleAddSession = () => {
    const clean = customSession.trim();
    const startYear = parseSessionStartYear(clean);
    if (!startYear) {
      setError('Use the format YYYY/YYYY, e.g. 2026/2027');
      return;
    }
    const added = addSession(clean);
    if (!added) {
      setError('That session already exists in the academic section.');
      return;
    }
    setActiveSessionByLabel(added.label);
    audit('Add session', 'Academic Section', `Added and activated session ${added.label}`);
    setCustomSession('');
    setError('');
  };

  return (
    <div className="academic-session-card">
      <div className="academic-session__active">
        <div className="academic-session__active-icon">
          <CalendarDays size={22} />
        </div>
        <div className="academic-session__active-info">
          <div className="academic-session__label">Current Academic Session</div>
          <div className="academic-session__value">{activeSession}</div>
          <div className="academic-session__hint">
            The section automatically follows the real current year; student levels are
            calculated from the session shown here.
          </div>
        </div>
      </div>

      <div className="academic-session__controls">
        <button
          type="button"
          className="action-btn"
          onClick={() => changeSession(-1)}
          disabled={activeIndex <= 0}
          aria-label="Previous session"
        >
          <ChevronLeft size={16} />
        </button>
        <select
          className="academic-session__select"
          value={activeSession}
          onChange={handleSelectSession}
        >
          {sorted.map((s) => (
            <option key={s.id} value={s.label}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="action-btn"
          onClick={() => changeSession(1)}
          disabled={activeIndex >= sorted.length - 1}
          aria-label="Next session"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {!compact && (
        <div className="academic-session__list">
          {sorted
            .slice()
            .reverse()
            .map((s) => (
              <div
                key={s.id}
                className={`academic-session__item${s.label === activeSession ? ' active' : ''}`}
              >
                <span className="academic-session__item-label">{s.label}</span>
                {s.label === activeSession ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <button
                    type="button"
                    className="action-btn danger"
                    onClick={() => removeSession(s.id)}
                    aria-label={`Remove ${s.label}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
        </div>
      )}

      <div className="academic-session__add">
        <div className="academic-session__add-title">
          <Plus size={16} />
          Add custom session
        </div>
        <div className="academic-session__add-row">
          <Input
            placeholder="e.g. 2026/2027"
            value={customSession}
            onChange={(e) => {
              setCustomSession(e.target.value);
              setError('');
            }}
            error={error}
          />
          <Button onClick={handleAddSession}>Add</Button>
        </div>
        <div className="academic-session__note">
          <Info size={14} />
          In cases like a strike or a pandemic, the admin can still control the
          school academic section &mdash; switch the active session instead of
          changing students&apos; records.
        </div>
      </div>
    </div>
  );
};

export default AcademicSessionCard;