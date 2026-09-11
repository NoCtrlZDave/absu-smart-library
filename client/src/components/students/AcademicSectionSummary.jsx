import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { useStudents } from '../../context/useStudent';
import '../../pages/admin/Admin.css';

const AcademicSectionSummary = ({ showHints = true }) => {
  const { activeSession } = useStudents();

  return (
    <div className="academic-session-summary">
      <div className="academic-session__active">
        <div className="academic-session__active-icon">
          <CalendarDays size={20} />
        </div>
        <div className="academic-session__active-info">
          <div className="academic-session__label">Active Academic Section</div>
          <div className="academic-session__value">{activeSession}</div>
          <div className="academic-session__hint">
            Every student&apos;s level is calculated from this section.
          </div>
        </div>
      </div>
      <Link to="/admin/academic-section" className="dashboard-section-link">
        Manage Academic Section <ArrowRight size={14} />
      </Link>
      {showHints && (
        <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.75rem' }}>
          Example: a student admitted in 2021 shows{' '}
          <code>2021/131178/regular</code>. With the active section at 2026/2027, their
          level is 600 (2026 − 2021 + 1). The admin can change this section in case of
          strikes or pandemics.
        </p>
      )}
    </div>
  );
};

export default AcademicSectionSummary;