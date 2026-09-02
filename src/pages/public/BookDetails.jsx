import { useParams, Link } from 'react-router-dom';
import { BookOpen, MapPin, Calendar, Hash, Building, Tag, ArrowLeft, Bookmark } from 'lucide-react';
import { Button, Badge } from '../../components/common';
import './Public.css';

const booksData = {
  1: {
    id: 1,
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    isbn: '978-0262033848',
    publisher: 'MIT Press',
    year: 2022,
    category: 'Computer Science',
    description: 'A comprehensive textbook covering a broad range of algorithms in depth, yet makes their design and analysis accessible to all levels of readers. Each chapter presents an algorithm, a design technique, an application area, or a related topic.',
    available: true,
    totalCopies: 5,
    availableCopies: 3,
    copies: [
      { id: 'CS-001', status: 'available', location: 'Floor 3, Section A, Rack 2, Shelf 4' },
      { id: 'CS-002', status: 'available', location: 'Floor 3, Section A, Rack 2, Shelf 4' },
      { id: 'CS-003', status: 'borrowed', location: 'Floor 3, Section A, Rack 2, Shelf 4' },
      { id: 'CS-004', status: 'available', location: 'Floor 3, Section A, Rack 2, Shelf 5' },
      { id: 'CS-005', status: 'reserved', location: 'Floor 3, Section A, Rack 2, Shelf 5' }
    ]
  },
  2: {
    id: 2,
    title: 'Engineering Mathematics',
    author: 'K.A. Stroud, Dexter J. Booth',
    isbn: '978-1352003215',
    publisher: 'Palgrave Macmillan',
    year: 2021,
    category: 'Engineering',
    description: 'An extensive undergraduate textbook covering essential mathematical topics for engineering students, including algebra, calculus, differential equations, and complex numbers.',
    available: true,
    totalCopies: 4,
    availableCopies: 2,
    copies: [
      { id: 'EN-001', status: 'available', location: 'Floor 2, Section B, Rack 1, Shelf 3' },
      { id: 'EN-002', status: 'borrowed', location: 'Floor 2, Section B, Rack 1, Shelf 3' },
      { id: 'EN-003', status: 'available', location: 'Floor 2, Section B, Rack 1, Shelf 4' },
      { id: 'EN-004', status: 'borrowed', location: 'Floor 2, Section B, Rack 1, Shelf 4' }
    ]
  }
};

const defaultBook = {
  id: 0,
  title: 'Sample Book Title',
  author: 'Author Name',
  isbn: '978-0000000000',
  publisher: 'Publisher Name',
  year: 2023,
  category: 'General',
  description: 'This is a sample book description that provides an overview of the book content and its relevance to the field of study.',
  available: true,
  totalCopies: 3,
  availableCopies: 2,
  copies: [
    { id: 'GN-001', status: 'available', location: 'Floor 1, Section A, Rack 1, Shelf 1' },
    { id: 'GN-002', status: 'available', location: 'Floor 1, Section A, Rack 1, Shelf 1' },
    { id: 'GN-003', status: 'borrowed', location: 'Floor 1, Section A, Rack 1, Shelf 2' }
  ]
};

const BookDetails = () => {
  const { id } = useParams();
  const book = booksData[id] || { ...defaultBook, id: parseInt(id) };

  return (
    <div className="book-details">
      <Link to="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '1.5rem', textDecoration: 'none', fontWeight: 500 }}>
        <ArrowLeft size={18} />
        Back to Search
      </Link>

      <div className="book-details-content">
        <div>
          <div className="book-cover-large">
            <BookOpen size={64} />
          </div>
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
                      {copy.location}
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
            <Link to={`/book/${book.id}/location`}>
              <Button variant="outline">
                <MapPin size={18} />
                Locate Book
              </Button>
            </Link>
            <Button disabled={!book.available}>
              <Bookmark size={18} />
              Reserve
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;
