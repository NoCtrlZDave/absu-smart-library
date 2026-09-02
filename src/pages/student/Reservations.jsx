import { useState } from 'react';
import { Bookmark, Clock, X } from 'lucide-react';
import { Button } from '../../components/common';
import './Student.css';

const initialReservations = [
  { id: 1, title: 'Software Engineering', author: 'Ian Sommerville', reservedDate: '2026-08-20', status: 'pending', position: 2 },
  { id: 2, title: 'Principles of Anatomy', author: 'G.J. Tortora', reservedDate: '2026-08-18', status: 'ready', position: 0 }
];

const Reservations = () => {
  const [reservations, setReservations] = useState(initialReservations);

  const handleCancel = (id) => {
    setReservations(prev => prev.filter(res => res.id !== id));
  };

  return (
    <div className="student-page">
      <div className="page-header">
        <h1>My Reservations</h1>
        <p>Manage your active book reservations.</p>
      </div>

      <div className="content-card">
        {reservations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <Bookmark size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>No active reservations.</p>
          </div>
        ) : (
          <div>
            {reservations.map(reservation => (
              <div key={reservation.id} className="reservation-item">
                <div className="reservation-info">
                  <div className="reservation-icon">
                    <Bookmark size={20} />
                  </div>
                  <div>
                    <strong>{reservation.title}</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                      {reservation.author}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>Reserved: {reservation.reservedDate}</span>
                      {reservation.position > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={14} />
                          Position: {reservation.position}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className={`badge ${reservation.status === 'ready' ? 'badge-success' : 'badge-warning'}`}>
                    {reservation.status === 'ready' ? 'Ready for Pickup' : 'Pending'}
                  </span>
                  <Button variant="danger" onClick={() => handleCancel(reservation.id)}>
                    <X size={16} />
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reservations;
