import { BookOpen, Clock, AlertTriangle } from 'lucide-react';
import './Student.css';

const borrowedBooks = [
  { id: 1, title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', borrowDate: '2026-08-28', dueDate: '2026-09-11', daysRemaining: 9, status: 'active' },
  { id: 2, title: 'Engineering Mathematics', author: 'K.A. Stroud', borrowDate: '2026-08-15', dueDate: '2026-08-29', daysRemaining: -4, status: 'overdue' },
  { id: 3, title: 'Database System Concepts', author: 'Abraham Silberschatz', borrowDate: '2026-08-20', dueDate: '2026-09-03', daysRemaining: 1, status: 'active' }
];

const BorrowedBooks = () => {
  return (
    <div className="student-page">
      <div className="page-header">
        <h1>My Borrowed Books</h1>
        <p>Books currently borrowed from the library.</p>
      </div>

      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Author</th>
                <th>Borrow Date</th>
                <th>Due Date</th>
                <th>Days Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {borrowedBooks.map(book => (
                <tr key={book.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <BookOpen size={18} style={{ color: 'var(--primary)' }} />
                      <strong>{book.title}</strong>
                    </div>
                  </td>
                  <td>{book.author}</td>
                  <td>{book.borrowDate}</td>
                  <td>{book.dueDate}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {book.daysRemaining < 0 ? (
                        <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
                      ) : (
                        <Clock size={14} />
                      )}
                      {Math.abs(book.daysRemaining)} days
                    </span>
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
      </div>
    </div>
  );
};

export default BorrowedBooks;
