import { useState } from 'react';
import { Search, Eye, RotateCcw, Clock } from 'lucide-react';
import { Button, Input, Select, Modal } from '../../components/common';
import { useAudit } from '../../context/useAudit';
import './Librarian.css';

const initialBorrowings = [
  { id: 1, book: 'Introduction to Algorithms', student: 'John Doe', matric: '2022/131001/regular', borrowDate: '2026-08-28', dueDate: '2026-09-11', status: 'active' },
  { id: 2, book: 'Database System Concepts', student: 'Sarah Johnson', matric: '2022/131014/regular', borrowDate: '2026-08-30', dueDate: '2026-09-13', status: 'active' },
  { id: 3, book: 'Engineering Mathematics', student: 'Michael Brown', matric: '2021/131078/regular', borrowDate: '2026-08-15', dueDate: '2026-08-29', status: 'overdue' },
  { id: 4, book: 'Organic Chemistry', student: 'Emily Davis', matric: '2023/131023/regular', borrowDate: '2026-08-25', dueDate: '2026-09-08', status: 'active' }
];

const Borrowings = () => {
  const [borrowings, setBorrowings] = useState(initialBorrowings);
  const { audit } = useAudit();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extensionDays, setExtensionDays] = useState(7);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBorrowing, setSelectedBorrowing] = useState(null);

  const filteredBorrowings = borrowings.filter(item => {
    const matchesSearch = search === '' ||
      item.book.toLowerCase().includes(search.toLowerCase()) ||
      item.student.toLowerCase().includes(search.toLowerCase()) ||
      item.matric.includes(search);
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReturn = (item) => {
    setSelectedBorrowing(item);
    setShowReturnModal(true);
  };

  const handleExtend = (item) => {
    setSelectedBorrowing(item);
    setShowExtendModal(true);
  };

  const handleView = (item) => {
    setSelectedBorrowing(item);
    setShowDetailsModal(true);
  };

  const confirmReturn = () => {
    setBorrowings(prev => prev.filter(b => b.id !== selectedBorrowing.id));
    audit('Return', 'Borrowing', `Processed return of "${selectedBorrowing.book}" by ${selectedBorrowing.student}`);
    setShowReturnModal(false);
  };

  const confirmExtend = () => {
    audit('Renew', 'Borrowing', `Extended due date for "${selectedBorrowing.book}" by ${selectedBorrowing.student}`);
    setShowExtendModal(false);
  };

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Active Borrowings</h1>
        <p>Manage all active book borrowings.</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Input
            placeholder="Search by book, student, or matric number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
          </Select>
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
                <th>Borrow Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBorrowings.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.book}</strong></td>
                  <td>{item.student}</td>
                  <td>{item.matric}</td>
                  <td>{item.borrowDate}</td>
                  <td>{item.dueDate}</td>
                  <td>
                    <span className={`badge ${item.status === 'overdue' ? 'badge-danger' : 'badge-success'}`}>
                      {item.status === 'overdue' ? 'Overdue' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="action-btn" onClick={() => handleView(item)} title="View">
                        <Eye size={16} />
                      </button>
                      <button className="action-btn" onClick={() => handleExtend(item)} title="Extend">
                        <Clock size={16} />
                      </button>
                      <button className="action-btn" style={{ color: 'var(--success)' }} onClick={() => handleReturn(item)} title="Return">
                        <RotateCcw size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showReturnModal} onClose={() => setShowReturnModal(false)} title="Confirm Return">
        <p>Confirm return of "{selectedBorrowing?.book}" borrowed by {selectedBorrowing?.student}?</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setShowReturnModal(false)}>Cancel</Button>
          <Button onClick={confirmReturn}>
            <RotateCcw size={18} />
            Confirm Return
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showExtendModal} onClose={() => setShowExtendModal(false)} title="Extend Due Date">
        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label>Extension Days</label>
          <Select value={extensionDays} onChange={(e) => setExtensionDays(Number(e.target.value))}>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="21">21 days</option>
            <option value="30">30 days</option>
          </Select>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setShowExtendModal(false)}>Cancel</Button>
          <Button onClick={confirmExtend}>
            <Clock size={18} />
            Extend by {extensionDays} Days
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Borrowing Details">
        {selectedBorrowing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><strong>Book:</strong> {selectedBorrowing.book}</div>
            <div><strong>Student:</strong> {selectedBorrowing.student}</div>
            <div><strong>Matric Number:</strong> {selectedBorrowing.matric}</div>
            <div><strong>Borrow Date:</strong> {selectedBorrowing.borrowDate}</div>
            <div><strong>Due Date:</strong> {selectedBorrowing.dueDate}</div>
            <div>
              <strong>Status:</strong>{' '}
              <span className={`badge ${selectedBorrowing.status === 'overdue' ? 'badge-danger' : 'badge-success'}`}>
                {selectedBorrowing.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Borrowings;
