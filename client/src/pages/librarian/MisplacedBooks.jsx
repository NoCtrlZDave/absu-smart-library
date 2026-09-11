import { useState } from 'react';
import { MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { Button, Badge } from '../../components/common';
import { useAudit } from '../../context/useAudit';
import './Librarian.css';

const initialMisplaced = [
  { id: 1, book: 'Principles of Anatomy', copyId: 'ME-002', expected: 'Floor 1, Section C, Rack 2, Shelf 1', detected: 'Floor 3, Section A, Rack 4', status: 'misplaced' },
  { id: 2, book: 'Organic Chemistry', copyId: 'CH-005', expected: 'Floor 2, Section D, Rack 1', detected: 'Floor 1, Section B', status: 'misplaced' },
  { id: 3, book: 'Business Ethics', copyId: 'BS-007', expected: 'Floor 4, Section A, Rack 3', detected: 'Floor 2, Section C, Rack 5', status: 'misplaced' }
];

const MisplacedBooks = () => {
  const [misplacedBooks, setMisplacedBooks] = useState(initialMisplaced);
  const { audit } = useAudit();

  const handleResolve = (id) => {
    const target = misplacedBooks.find(book => book.id === id);
    setMisplacedBooks(prev => prev.map(book => 
      book.id === id ? { ...book, status: 'resolved' } : book
    ));
    audit('Resolve', 'Misplaced Book', `Marked "${target?.book}" (${target?.copyId}) as resolved`);
  };

  const pendingCount = misplacedBooks.filter(b => b.status === 'misplaced').length;

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Misplaced Books</h1>
        <p>
          {pendingCount} book{pendingCount !== 1 ? 's' : ''} detected outside their expected location.
        </p>
      </div>

      <div className="content-card">
        {misplacedBooks.map(book => (
          <div
            key={book.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              background: book.status === 'resolved' ? 'rgba(40, 167, 69, 0.05)' : 'var(--background)',
              borderRadius: '12px',
              marginBottom: '1rem',
              border: book.status === 'resolved' ? '1px solid var(--success)' : '1px solid var(--border)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <MapPin size={20} style={{ color: book.status === 'resolved' ? 'var(--success)' : 'var(--warning)' }} />
                <div>
                  <strong style={{ color: 'var(--text)', fontSize: '1rem' }}>{book.book}</strong>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                    (Copy: {book.copyId})
                  </span>
                </div>
              </div>
              <div style={{ marginLeft: '2.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Expected: </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{book.expected}</span>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--danger)' }} />
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Detected: </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--warning)' }}>{book.detected}</span>
                </div>
              </div>
            </div>
            <div>
              {book.status === 'resolved' ? (
                <Badge variant="success">
                  <CheckCircle size={14} />
                  Resolved
                </Badge>
              ) : (
                <Button onClick={() => handleResolve(book.id)}>
                  <CheckCircle size={18} />
                  Mark Resolved
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MisplacedBooks;
