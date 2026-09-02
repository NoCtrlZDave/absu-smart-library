import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Hash, Building, Tag, ArrowLeft, Bookmark, BookOpen } from 'lucide-react';
import { Button, Badge, BookCover } from '../../components/common';
import { makeLocationString } from '../../data/books';
import { useBooks } from '../../context/useBook';
import { useAuth } from '../../context/useAuth';
import './Public.css';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBook } = useBooks();
  const { user } = useAuth();
  const book = getBook(id);

  const requireLogin = (nextPath) => {
    if (user) {
      navigate(nextPath);
      return;
    }
    navigate(`/login?redirect=${encodeURIComponent(nextPath)}`);
  };

  if (!book) {
    return (
      <div className="book-details" style={{ textAlign: 'center', padding: '4rem' }}>
        <BookOpen size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
        <h1 style={{ marginBottom: '0.5rem' }}>Book Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          The book you are looking for does not exist or has been removed.
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

  return (
    <div className="book-details">
      <Link to="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '1.5rem', textDecoration: 'none', fontWeight: 500 }}>
        <ArrowLeft size={18} />
        Back to Search
      </Link>

      <div className="book-details-content">
        <div>
          <BookCover book={book} size="large" />
        </div>

        <div className="book-details-info">
          <h1>{book.title}</h1>
          <p className="book-author">by {book.author}</p>

          <Badge variant={book.available ? 'success' : 'danger'} style={{ marginBottom: '1.5rem' }}>
            {book.available ? `${book.availableCopies} Copies Available` : 'All Copies Borrowed'}
          </Badge>

          <div className="book-meta-grid">
            <div className="meta-item">
              <span className="meta-label">
                <Hash size={14} style={{ marginRight: '4px' }} />
                ISBN
              </span>
              <span className="meta-value">{book.isbn}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">
                <Building size={14} style={{ marginRight: '4px' }} />
                Publisher
              </span>
              <span className="meta-value">{book.publisher}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">
                <Calendar size={14} style={{ marginRight: '4px' }} />
                Year
              </span>
              <span className="meta-value">{book.year}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">
                <Tag size={14} style={{ marginRight: '4px' }} />
                Category
              </span>
              <span className="meta-value">{book.category}</span>
            </div>
          </div>

          <div className="book-description">
            <h3>Description</h3>
            <p>{book.description}</p>
          </div>

          <div className="copies-section">
            <h3>Copies ({book.totalCopies} total)</h3>
            <div className="copies-list">
              {book.copies.map(copy => (
                <div key={copy.id} className="copy-item">
                  <div>
                    <strong>{copy.id}</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                      {copy.location || makeLocationString(book)}
                    </p>
                  </div>
                  <Badge variant={
                    copy.status === 'available' ? 'success' :
                    copy.status === 'borrowed' ? 'danger' : 'warning'
                  }>
                    {copy.status.charAt(0).toUpperCase() + copy.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="book-actions">
            <Button variant="outline" onClick={() => requireLogin(`/books/${book.id}/location`)}>
              <MapPin size={18} />
              Locate Book
            </Button>
            <Button disabled={!book.available} onClick={() => user ? alert('Reservation feature coming soon.') : requireLogin(`/books/${book.id}`)}>
              <Bookmark size={18} />
              {user ? 'Reserve' : 'Reserve (Login to continue)'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
