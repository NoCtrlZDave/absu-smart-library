import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Copy, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Button, Modal } from '../../components/common';
import './Librarian.css';

const initialCopies = [
  { id: 'CS-001', status: 'available', location: 'Floor 3, Section A, Rack 2, Shelf 4' },
  { id: 'CS-002', status: 'available', location: 'Floor 3, Section A, Rack 2, Shelf 4' },
  { id: 'CS-003', status: 'borrowed', borrower: 'John Doe', dueDate: '2026-09-15', location: 'Floor 3, Section A, Rack 2, Shelf 4' },
  { id: 'CS-004', status: 'available', location: 'Floor 3, Section A, Rack 2, Shelf 5' },
  { id: 'CS-005', status: 'reserved', reservedBy: 'Sarah Johnson', location: 'Floor 3, Section A, Rack 2, Shelf 5' }
];

const BookCopies = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [copies, setCopies] = useState(initialCopies);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copyToDelete, setCopyToDelete] = useState(null);

  const handleDeleteClick = (copy) => {
    setCopyToDelete(copy);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setCopies(prev => prev.filter(c => c.id !== copyToDelete.id));
    setShowDeleteModal(false);
    setCopyToDelete(null);
  };

  const handleAddCopy = () => {
    const newId = `CS-00${copies.length + 1}`;
    setCopies(prev => [...prev, { id: newId, status: 'available', location: 'Floor 3, Section A, Rack 2, Shelf 5' }]);
  };

  return (
    <div className="librarian-page">
      <button
        onClick={() => navigate('/librarian/books')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
      >
        <ArrowLeft size={18} />
        Back to Books
      </button>

      <div className="page-header">
        <h1>Book Copies</h1>
        <p>Introduction to Algorithms (Book ID: {id})</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <p style={{ color: 'var(--text-secondary)' }}>
            {copies.filter(c => c.status === 'available').length} of {copies.length} copies available
          </p>
        </div>
        <div className="toolbar-right">
          <Button onClick={handleAddCopy}>
            <Plus size={18} />
            Add Copy
          </Button>
        </div>
      </div>

      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Copy ID</th>
                <th>Status</th>
                <th>Location</th>
                <th>Borrower</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {copies.map(copy => (
                <tr key={copy.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Copy size={16} style={{ color: 'var(--primary)' }} />
                      <strong>{copy.id}</strong>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      copy.status === 'available' ? 'badge-success' :
                      copy.status === 'borrowed' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {copy.status.charAt(0).toUpperCase() + copy.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={14} />
                      {copy.location}
                    </div>
                  </td>
                  <td>{copy.borrower || copy.reservedBy || '-'}</td>
                  <td>{copy.dueDate || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="action-btn" title="Edit">
                        <Pencil size={16} />
                      </button>
                      <button className="action-btn danger" onClick={() => handleDeleteClick(copy)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Copy"
      >
        <p>Are you sure you want to delete copy {copyToDelete?.id}? This action cannot be undone.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            <Trash2 size={18} />
            Delete Copy
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default BookCopies;
