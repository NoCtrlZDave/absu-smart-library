import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import './BookCover.css';

const BOOK_COVER_SIZE = {
  small: 'S',
  medium: 'M',
  large: 'L',
};

const BookCover = ({ book, size = 'medium', className = '' }) => {
  const [errored, setErrored] = useState(false);
  const isbn = book?.isbn;
  const sizeTier = BOOK_COVER_SIZE[size] || 'M';
  const src = isbn
    ? `https://covers.openlibrary.org/b/isbn/${isbn}-${sizeTier}.jpg?default=false`
    : null;

  if (!src || errored) {
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
        onError={() => setErrored(true)}
      />
    </div>
  );
};

export default BookCover;
