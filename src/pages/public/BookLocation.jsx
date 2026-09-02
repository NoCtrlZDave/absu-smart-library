import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Layers, Grid3X3, BookOpen } from 'lucide-react';
import { Button } from '../../components/common';
import { useBooks } from '../../context/useBook';
import './Public.css';

const BookLocation = () => {
  const { id } = useParams();
  const { getBook } = useBooks();
  const book = getBook(id);

  if (!book) {
    return (
      <div className="book-location" style={{ textAlign: 'center', padding: '4rem' }}>
        <BookOpen size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
        <h1 style={{ marginBottom: '0.5rem' }}>Book Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          We could not find the location of this book.
        </p>
        <Link to="/search">
          <Button>
            <ArrowLeft size={18} />
            Back to Search
          </Button>
        </Link>
      </div>
    );
  }

  const { library = 'Main Library', floor = 'Floor 1', section = 'Section A', rack = 'Rack 1', shelf = 'Shelf 1' } = book.location || {};
  const description = book.location?.description ||
    `This book is located in the ${book.category} section on ${floor} of the ${library}.`;

  return (
    <div className="book-location">
      <Link to={`/books/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '1.5rem', textDecoration: 'none', fontWeight: 500 }}>
        <ArrowLeft size={18} />
        Back to Book Details
      </Link>

      <div className="location-card">
        <div className="location-header">
          <h1>Book Location</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {book.title}
          </p>
        </div>

        <div className="location-path">
          <div className="location-node">
            <div className="location-node-icon">
              <Building2 size={24} />
            </div>
            <span className="location-node-label">Library</span>
            <span className="location-node-value">{library}</span>
          </div>

          <div className="location-node">
            <div className="location-node-icon">
              <Layers size={24} />
            </div>
            <span className="location-node-label">Floor</span>
            <span className="location-node-value">{floor}</span>
          </div>

          <div className="location-node">
            <div className="location-node-icon">
              <Grid3X3 size={24} />
            </div>
            <span className="location-node-label">Section</span>
            <span className="location-node-value">{section}</span>
          </div>

          <div className="location-node active">
            <div className="location-node-icon">
              <BookOpen size={24} />
            </div>
            <span className="location-node-label">Rack - Shelf</span>
            <span className="location-node-value">{rack}, {shelf}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem', padding: '2rem', background: 'var(--background)', borderRadius: '12px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1rem' }}>
            {description}
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {book.available
              ? `${book.availableCopies} of ${book.totalCopies} copies are available here`
              : 'All copies are currently borrowed or reserved'}
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to={`/books/${id}`}>
            <Button>
              <ArrowLeft size={18} />
              Return to Book Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookLocation;
