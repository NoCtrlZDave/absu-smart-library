import { BookOpen, CheckCircle } from 'lucide-react';
import './Student.css';

const historyData = [
  { id: 1, title: 'Database System Concepts', author: 'Abraham Silberschatz', borrowDate: '2026-07-15', returnDate: '2026-08-25', status: 'returned' },
  { id: 2, title: 'Organic Chemistry', author: 'Paula Yurkanis Bruice', borrowDate: '2026-07-01', returnDate: '2026-07-28', status: 'returned' },
  { id: 3, title: 'Business Ethics', author: 'O.C. Ferrell', borrowDate: '2026-06-15', returnDate: '2026-07-10', status: 'returned' },
  { id: 4, title: 'Physics for Scientists', author: 'Raymond A. Serway', borrowDate: '2026-06-01', returnDate: '2026-06-25', status: 'returned' },
  { id: 5, title: 'Constitutional Law', author: 'Ernest L. Phillips', borrowDate: '2026-05-10', returnDate: '2026-05-28', status: 'returned' }
];

const History = () => {
  return (
    <div className="student-page">
      <div className="page-header">
        <h1>Borrowing History</h1>
        <p>Your complete borrowing history from the library.</p>
      </div>

      <div className="content-card">
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
              {historyData.map(item => (
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
      </div>
    </div>
  );
};

export default History;
