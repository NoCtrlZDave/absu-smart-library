import { useState, useEffect } from 'react';
import { Bookmark, Clock, X } from 'lucide-react';
import { Button, Spinner } from '../../components/common';
import { circulationApi } from '../../services/circulation';
import './Student.css';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');

const mapReservation = (r) => ({
  id: r.id,
  title: r.book_title || r.title || '-',
  author: r.author || '-',
  reservedDate: formatDate(r.reserve_date || r.created_at),
  status: r.status,
  position: r.position ?? 0,
});

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    try {
      const data = await circulationApi.myReservations();
      setReservations((data || []).map(mapReservation));
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id) => {
    setCancelling(true);
    try {
      await circulationApi.cancelReservation(id);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to cancel reservation');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <div className="student-page" style={{ color: 'var(--danger)', textAlign: 'center', padding: '3rem' }}>{error}</div>;

  const isPending = (s) => s === 'pending' || s === 'reserved' || s === 'active';

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
            {reservations.map((reservation) => (
              <div key={reservation.id} className="reservation-item">
                <div className="reservation-info">
                  <div className="reservation-icon"><Bookmark size={20} /></div>
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
                  <span className={`badge ${['ready', 'fulfilled', 'available'].includes(reservation.status) ? 'badge-success' : 'badge-warning'}`}>
                    {['ready', 'fulfilled', 'available'].includes(reservation.status) ? 'Ready for Pickup' : 'Pending'}
                  </span>
                  {isPending(reservation.status) && (
                    <Button variant="danger" onClick={() => handleCancel(reservation.id)} disabled={cancelling}>
                      <X size={16} />
                      {cancelling ? 'Cancelling...' : 'Cancel'}
                    </Button>
                  )}
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
