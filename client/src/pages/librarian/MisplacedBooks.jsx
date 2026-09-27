import { useState, useEffect } from 'react';
import { MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { Button, Badge } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { useAudit } from '../../context/useAudit';
import { inventoryApi } from '../../services/inventory';
import './Librarian.css';

const MisplacedBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const { audit } = useAudit();
  const showToast = useToast();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const rows = await inventoryApi.misplaced();
        if (mounted) setBooks(rows || []);
      } catch (err) {
        showToast(err.message || 'Failed to load misplaced books.', 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      await inventoryApi.resolve(id);
      const target = books.find((b) => b.id === id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
      audit('Resolve', 'Misplaced Book', `Marked "${target?.book_title}" (${target?.copy_code}) as resolved`);
      showToast('Misplaced book resolved.');
    } catch (err) {
      showToast(err.message || 'Failed to resolve book.', 'error');
    } finally {
      setResolvingId(null);
    }
  };

  const pendingCount = books.filter((b) => b.status === 'open' || b.status === 'misplaced').length;

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Misplaced Books</h1>
        <p>
          {pendingCount} book{pendingCount !== 1 ? 's' : ''} detected outside their expected location.
        </p>
      </div>

      <div className="content-card">
        {loading ? (
          <p style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading misplaced books...</p>
        ) : !books.length ? (
          <p style={{ padding: '2rem', color: 'var(--text-secondary)' }}>No misplaced books detected.</p>
        ) : books.map(book => (
          <div
            key={book.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1.5rem',
              background: 'var(--background)',
              borderRadius: '12px',
              marginBottom: '1rem',
              border: '1px solid var(--border)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                <MapPin size={20} style={{ color: 'var(--warning)' }} />
                <div>
                  <strong style={{ color: 'var(--text)', fontSize: '1rem' }}>{book.book_title}</strong>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                    (Copy: {book.copy_code})
                  </span>
                </div>
              </div>
              <div style={{ marginLeft: '2.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Expected: </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{book.expected_location || 'Unknown'}</span>
                </div>
                <ArrowRight size={16} style={{ color: 'var(--danger)' }} />
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Detected: </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--warning)' }}>{book.detected_location || 'Unknown'}</span>
                </div>
              </div>
            </div>
            <div>
              <Button onClick={() => handleResolve(book.id)} loading={resolvingId === book.id} disabled={resolvingId !== null}>
                <CheckCircle size={18} />
                Mark Resolved
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MisplacedBooks;