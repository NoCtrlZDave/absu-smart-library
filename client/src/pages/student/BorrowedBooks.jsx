import { useState, useEffect } from 'react';
import { BookOpen, Clock, AlertTriangle } from 'lucide-react';
import { circulationApi } from '../../services/circulation';
import { Spinner } from '../../components/common';
import './Student.css';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');

const daysRemaining = (dueDate) => {
  if (!dueDate) return null;
  const diff = new Date(dueDate) - new Date();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const mapBorrowing = (b) => {
  const status = b.status === 'overdue' ? 'overdue' : 'active';
  return {
    id: b.id,
    title: b.book_title || b.title || '-',
    author: b.author || '-',
    borrowDate: formatDate(b.borrow_date || b.borrowed_at),
    dueDate: formatDate(b.due_date),
    daysRemaining: daysRemaining(b.due_date),
    status,
    copyCode: b.copy_code || b.copy || '-',
    renewed: b.renewed_count || 0,
    fine: b.fine || 0,
  };
};

const BorrowedBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await circulationApi.myBorrowings();
        if (!mounted) return;
        setBooks((data || []).map(mapBorrowing));
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load borrowings');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Spinner />;
  if (error) return <div className="student-page" style={{ color: 'var(--danger)', textAlign: 'center', padding: '3rem' }}>{error}</div>;

  return (
    <div className="student-page">
      <div className="page-header">
        <h1>My Borrowed Books</h1>
        <p>Books currently borrowed from the library.</p>
      </div>

      <div className="content-card">
        {books.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>You have no borrowed books.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Author</th>
                  <th>Copy</th>
                  <th>Borrow Date</th>
                  <th>Due Date</th>
                  <th>Days Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BookOpen size={18} style={{ color: 'var(--primary)' }} />
                        <strong>{book.title}</strong>
                      </div>
                    </td>
                    <td>{book.author}</td>
                    <td>{book.copyCode}</td>
                    <td>{book.borrowDate}</td>
                    <td>{book.dueDate}</td>
                    <td>
                      {book.daysRemaining === null ? (
                        '-'
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {book.daysRemaining < 0 ? (
                            <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
                          ) : (
                            <Clock size={14} />
                          )}
                          {Math.abs(book.daysRemaining)} days
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${book.status === 'overdue' ? 'badge-danger' : 'badge-success'}`}>
                        {book.status === 'overdue' ? 'Overdue' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BorrowedBooks;
