import { useMemo } from 'react';
import { GraduationCap, Info, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import AcademicSessionCard from '../../components/students/AcademicSessionCard';
import { Badge } from '../../components/common';
import { useStudents } from '../../context/useStudent';
import './Admin.css';

const levelVariant = (level) => {
  if (level >= 500) return 'danger';
  if (level >= 400) return 'warning';
  if (level >= 300) return 'info';
  return 'success';
};

const AcademicSectionPage = () => {
  const { students, getStudentLevel } = useStudents();

  const levelBreakdown = useMemo(() => {
    const counts = new Map();
    students.forEach((student) => {
      const level = getStudentLevel(student);
      if (!level) return;
      counts.set(level, (counts.get(level) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([level, count]) => ({ level, count }));
  }, [students, getStudentLevel]);

  const totalCounted = levelBreakdown.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="admin-page">
      <div className="page-header">
        <Link to="/admin/dashboard" className="back-link">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1>Academic Section</h1>
        <p>
          One global session that drives the level of every student. Changing it here
          recalculates all levels at once.
        </p>
      </div>

      <div className="content-grid">
        <div className="content-card">
          <h2>Active Section</h2>
          <AcademicSessionCard />
        </div>

        <div className="content-card">
          <h2>Students per Level</h2>
          <p className="text-muted" style={{ marginTop: '-0.5rem' }}>
            Live preview of how the current section orders students by level.
          </p>
          {levelBreakdown.length === 0 ? (
            <p className="text-muted">No students with a calculable level yet.</p>
          ) : (
            <>
              <div className="level-breakdown-list">
                {levelBreakdown.map(({ level, count }) => (
                  <div key={level} className="level-breakdown-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GraduationCap size={16} style={{ color: 'var(--primary)' }} />
                      <Badge variant={levelVariant(level)}>{level} Level</Badge>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="level-breakdown-bar">
                        <div
                          className={`level-breakdown-fill ${levelVariant(level)}`}
                          style={{
                            width: `${totalCounted ? Math.max(4, (count / totalCounted) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <strong style={{ color: 'var(--text)', minWidth: '2rem', textAlign: 'right' }}>
                        {count}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
              <div className="academic-session__note" style={{ marginTop: '1rem' }}>
                <Info size={14} />
                Level = (section start year &minus; admission year + 1) &times; 100. The
                admission year comes from the student&apos;s matric number, e.g. 2021 in{' '}
                <code>2021/131178/regular</code>.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademicSectionPage;