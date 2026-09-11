import { useState } from 'react';
import { Bookmark, CheckCircle, XCircle, Search } from 'lucide-react';
import { Button, Input, Modal } from '../../components/common';
import { useAudit } from '../../context/useAudit';
import './Librarian.css';

const initialReservations = [
  { id: 1, book: 'Software Engineering', student: 'Alice Okoye', matric: '2022/131045/regular', reservedDate: '2026-08-20', status: 'pending', position: 2 },
  { id: 2, book: 'Principles of Anatomy', student: 'David Eze', matric: '2023/131012/regular', reservedDate: '2026-08-18', status: 'ready', position: 0 },
  { id: 3, book: 'Business Ethics', student: 'Grace Uche', matric: '2021/131089/regular', reservedDate: '2026-08-15', status: 'pending', position: 1 }
];

const ReservationsManagement = () => {
  const [reservations, setReservations] = useState(initialReservations);
  const { audit } = useAudit();
  const [search, setSearch] = useState('');
  const [showFulfillModal, setShowFulfillModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const filteredReservations = reservations.filter(res => {
    return search === '' ||
      res.book.toLowerCase().includes(search.toLowerCase()) ||
      res.student.toLowerCase().includes(search.toLowerCase()) ||
      res.matric.includes(search);
  });

  const handleFulfill = (reservation) => {
    setSelectedReservation(reservation);
    setShowFulfillModal(true);
  };

  const handleCancel = (reservation) => {
    setSelectedReservation(reservation);
    setShowCancelModal(true);
  };

  const confirmFulfill = () => {
    setReservations(prev => prev.filter(r => r.id !== selectedReservation.id));
    audit('Fulfill', 'Reservation', `Fulfilled reservation of "${selectedReservation.book}" by ${selectedReservation.student}`);
    setShowFulfillModal(false);
  };

  const confirmCancel = () => {
    setReservations(prev => prev.filter(r => r.id !== selectedReservation.id));
    audit('Cancel', 'Reservation', `Cancelled reservation of "${selectedReservation.book}" by ${selectedReservation.student}`);
    setShowCancelModal(false);
  };

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Reservations Management</h1>
        <p>Manage all book reservations in the library.</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Input
            placeholder="Search by book, student, or matric..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />
        </div>
      </div>

      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Student</th>
                <th>Matric Number</th>
                <th>Reserved Date</th>
                <th>Position</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map(res => (
                <tr key={res.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Bookmark size={16} style={{ color: 'var(--primary)' }} />
                      <strong>{res.book}</strong>
                    </div>
                  </td>
                  <td>{res.student}</td>
                  <td>{res.matric}</td>
                  <td>{res.reservedDate}</td>
                  <td>{res.position === 0 ? '-' : res.position}</td>
                  <td>
                    <span className={`badge ${res.status === 'ready' ? 'badge-success' : 'badge-warning'}`}>
                      {res.status === 'ready' ? 'Ready for Pickup' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button variant="outline" size="sm" onClick={() => handleFulfill(res)}>
                        <CheckCircle size={16} />
                        Fulfill
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleCancel(res)}>
                        <XCircle size={16} />
                        Cancel
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showFulfillModal} onClose={() => setShowFulfillModal(false)} title="Fulfill Reservation">
        <p>
          Confirm reservation fulfillment for "{selectedReservation?.book}" by {selectedReservation?.student}?
          This will create a borrowing record.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setShowFulfillModal(false)}>Cancel</Button>
          <Button onClick={confirmFulfill}>
            <CheckCircle size={18} />
            Confirm Fulfill
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Reservation">
        <p>
          Are you sure you want to cancel reservation for "{selectedReservation?.book}" by {selectedReservation?.student}?
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setShowCancelModal(false)}>Keep</Button>
          <Button variant="danger" onClick={confirmCancel}>
            <XCircle size={18} />
            Cancel Reservation
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ReservationsManagement;
