import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import './BookCover.css';

const BOOK_COVER_SIZE = {
  small: 'S',
  medium: 'M',
  large: 'L',
};

const BookCover = ({ book, size = 'medium', className = '' }) => {
  const [failed, setFailed] = useState(0);
  const sizeTier = BOOK_COVER_SIZE[size] || 'M';
  const sizes = book?.coverImage || book?.isbn;

  const sources = [];
  if (book?.coverImage) sources.push(book.coverImage);
  if (book?.isbn) {
    sources.push(`https://covers.openlibrary.org/b/isbn/${book.isbn}-${sizeTier}.jpg?default=false`);
  }

  const src = failed < sources.length ? sources[failed] : null;

  if (!src || !sizes) {
    return (
      <div
        className={`book-cover book-cover--fallback ${size && `book-cover--${size}`} ${className}`}
      >
        {size === 'large' ? <BookOpen size={64} /> : <BookOpen size={48} />}
        {size === 'large' && (
          <span className="book-cover__fallback-title">{book?.title}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`book-cover book-cover--img ${size && `book-cover--${size}`} ${className}`}>
      <img
        src={src}
        alt={`${book?.title} cover`}
        loading="lazy"
        onError={() => setFailed((n) => n + 1)}
      />
    </div>
  );
};

export default BookCover;