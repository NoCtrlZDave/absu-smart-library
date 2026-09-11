import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle } from 'lucide-react';
import { Spinner } from '../../components/common';
import { circulationApi } from '../../services/circulation';
import './Student.css';

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '-');

const mapItem = (item) => ({
  id: item.id,
  title: item.book_title || item.title || '-',
  author: item.author || '-',
  borrowDate: formatDate(item.borrow_date || item.borrowed_at),
  returnDate: formatDate(item.return_date || item.returned_at),
  status: item.status || 'returned',
});

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await circulationApi.myHistory();
        if (!mounted) return;
        setHistory((data || []).map(mapItem));
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load history');
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
        <h1>Borrowing History</h1>
        <p>Your complete borrowing history from the library.</p>
      </div>

      <div className="content-card">
        {history.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No borrowing history yet.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Author</th>
                  <th>Borrow Date</th>
                  <th>Return Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BookOpen size={18} style={{ color: 'var(--primary)' }} />
                        <strong>{item.title}</strong>
                      </div>
                    </td>
                    <td>{item.author}</td>
                    <td>{item.borrowDate}</td>
                    <td>{item.returnDate}</td>
                    <td>
                      <span className="badge badge-success">
                        <CheckCircle size={12} style={{ marginRight: '4px' }} />
                        Returned
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

export default History;
