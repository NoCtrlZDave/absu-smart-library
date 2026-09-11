import { useState } from 'react';
import { ScanLine, Search, BookOpen, User, CheckCircle } from 'lucide-react';
import { Button, Input } from '../../components/common';
import { useAudit } from '../../context/useAudit';
import './Librarian.css';

const ReturnableBooks = [
  { id: 1, book: 'Introduction to Algorithms', student: 'John Doe', matric: '2022/131001/regular', dueDate: '2026-09-11', copyId: 'CS-003' },
  { id: 2, book: 'Database System Concepts', student: 'Sarah Johnson', matric: '2022/131014/regular', dueDate: '2026-09-13', copyId: 'DB-002' }
];

const Returns = () => {
  const { audit } = useAudit();
  const [searchInput, setSearchInput] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [returnedBooks, setReturnedBooks] = useState(ReturnableBooks);

  const handleSearch = (e) => {
    e.preventDefault();
    const match = returnedBooks.find(book => 
      book.copyId.toLowerCase() === searchInput.toLowerCase() ||
      book.book.toLowerCase().includes(searchInput.toLowerCase())
    );
    if (match) {
      setSelectedBook(match);
    }
  };

  const handleConfirmReturn = () => {
    setConfirmed(true);
    setReturnedBooks(prev => prev.filter(b => b.copyId !== selectedBook.copyId));
    audit('Return', 'Book Copy', `Returned copy ${selectedBook.copyId} of "${selectedBook.book}" by ${selectedBook.student}`);
  };

  const handleReset = () => {
    setSelectedBook(null);
    setConfirmed(false);
    setSearchInput('');
  };

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Return Processing</h1>
        <p>Scan or search for books to process returns.</p>
      </div>

      <div className="scan-section">
        <div className="scan-icon">
          <ScanLine size={40} />
        </div>
        <h2 style={{ color: 'var(--text)', marginBottom: '1rem' }}>Scan Book Covers or Enter Copy ID</h2>
        <form className="scan-input" onSubmit={handleSearch}>
          <Input
            placeholder="Enter copy ID or book title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            icon={Search}
          />
          <Button type="submit">Find</Button>
        </form>
      </div>

      {confirmed ? (
        <div className="content-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <CheckCircle size={64} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Book Returned Successfully!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Copy {selectedBook?.copyId} of "{selectedBook?.book}" has been returned.
          </p>
          <Button onClick={handleReset}>Process Another Return</Button>
        </div>
      ) : selectedBook ? (
        <div className="content-card">
          <h2>Confirm Return</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '2rem', background: 'var(--background)', borderRadius: '12px', marginBottom: '1.5rem' }}>
            <div className="book-cover-thumb" style={{ width: 80, height: 110 }}>
              <BookOpen size={36} />
            </div>
            <div>
              <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>{selectedBook.book}</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Copy ID: {selectedBook.copyId}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} />
                  {selectedBook.student}
                </span>
                <span>Matric: {selectedBook.matric}</span>
              </div>
              <p style={{ marginTop: '0.5rem', color: 'var(--warning)' }}>
                Due Date: {selectedBook.dueDate}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setSelectedBook(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmReturn}>
              <CheckCircle size={18} />
              Confirm Return
            </Button>
          </div>
        </div>
      ) : (
        <div className="content-card">
          <h2>Returnable Books</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Copy ID</th>
                  <th>Book</th>
                  <th>Student</th>
                  <th>Matric</th>
                  <th>Due Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {returnedBooks.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No books currently borrowed.
                    </td>
                  </tr>
                ) : returnedBooks.map(book => (
                  <tr key={book.id}>
                    <td><strong>{book.copyId}</strong></td>
                    <td>{book.book}</td>
                    <td>{book.student}</td>
                    <td>{book.matric}</td>
                    <td>{book.dueDate}</td>
                    <td>
                      <Button variant="outline" size="sm" onClick={() => setSelectedBook(book)}>
                        Process Return
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
