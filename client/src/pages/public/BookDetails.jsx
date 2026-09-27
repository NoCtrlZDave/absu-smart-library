import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Hash, Building, Tag, ArrowLeft, BookOpen, Layers, FileText, Stamp, List, Milestone } from 'lucide-react';
import { Button, Badge, BookCover } from '../../components/common';
import { useBooks } from '../../context/useBook';
import './Public.css';

const makeLocationString = (book) => {
  const loc = book.location || {};
  const parts = [loc.floor, loc.section, loc.rack, loc.shelf].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Location not set';
};

const BookDetails = () => {
  const { id } = useParams();
  const { getBook } = useBooks();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getBook(id).then((result) => {
      if (!mounted) return;
      setBook(result);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [id, getBook]);

  if (loading) {
    return (
      <div className="book-details" style={{ textAlign: 'center', padding: '4rem' }}>
        <BookOpen size={64} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading book...</p>
      </div>
    );
  }

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
            {book.available ? `${book.availableCopies} Copies Available` : `${book.totalCopies} Copies`}
          </Badge>

          <div className="book-meta-grid">
            <div className="meta-item">
              <span className="meta-label">
                <Hash size={14} style={{ marginRight: '4px' }} />
                ISBN
              </span>
              <span className="meta-value">{book.isbn || 'N/A'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">
                <Building size={14} style={{ marginRight: '4px' }} />
                Publisher
              </span>
              <span className="meta-value">{book.publisher || 'N/A'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">
                <Calendar size={14} style={{ marginRight: '4px' }} />
                Year
              </span>
              <span className="meta-value">{book.year || 'N/A'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">
                <Tag size={14} style={{ marginRight: '4px' }} />
                Category
              </span>
              <span className="meta-value">{book.category || 'General'}</span>
            </div>
            {book.edition && (
              <div className="meta-item">
                <span className="meta-label">
                  <Layers size={14} style={{ marginRight: '4px' }} />
                  Edition
                </span>
                <span className="meta-value">{book.edition}</span>
              </div>
            )}
            {book.placeOfPublication && (
              <div className="meta-item">
                <span className="meta-label">
                  <MapPin size={14} style={{ marginRight: '4px' }} />
                  Place of Publication
                </span>
                <span className="meta-value">{book.placeOfPublication}</span>
              </div>
            )}
            {book.format && (
              <div className="meta-item">
                <span className="meta-label">
                  <FileText size={14} style={{ marginRight: '4px' }} />
                  Format
                </span>
                <span className="meta-value">{book.format}</span>
              </div>
            )}
            {book.physicalDescription && (
              <div className="meta-item">
                <span className="meta-label">
                  <FileText size={14} style={{ marginRight: '4px' }} />
                  Physical Description
                </span>
                <span className="meta-value">{book.physicalDescription}</span>
              </div>
            )}
          </div>

          <div className="book-description">
            <h3>Description</h3>
            <p>{book.description || 'No description available.'}</p>
          </div>

          {(book.subjects && book.subjects.length > 0) && (
            <div className="book-description">
              <h3>Subject Areas</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {book.subjects.map((s) => (
                  <Badge key={s} variant="info">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {(book.notes && book.notes.length > 0) && (
            <div className="book-description">
              <h3>Notes</h3>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)' }}>
                {book.notes.map((n, i) => (
                  <li key={`${n}-${i}`} style={{ marginBottom: '0.25rem' }}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          {book.cataloguing && (book.cataloguing.cataloguedBy || book.cataloguing.checkedBy || book.cataloguing.cip || book.cataloguing.originalCataloguing) && (
            <div className="book-description">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stamp size={16} style={{ color: 'var(--primary)' }} />
                Cataloguing
              </h3>
              <div className="book-meta-grid" style={{ marginTop: '0.25rem' }}>
                {book.cataloguing.cataloguedBy && (
                  <div className="meta-item">
                    <span className="meta-label">Catalogued By</span>
                    <span className="meta-value">{book.cataloguing.cataloguedBy}</span>
                  </div>
                )}
                {book.cataloguing.cataloguedDate && (
                  <div className="meta-item">
                    <span className="meta-label">Cataloguing Date</span>
                    <span className="meta-value">{book.cataloguing.cataloguedDate}</span>
                  </div>
                )}
                {book.cataloguing.checkedBy && (
                  <div className="meta-item">
                    <span className="meta-label">Checked By</span>
                    <span className="meta-value">{book.cataloguing.checkedBy}</span>
                  </div>
                )}
                {book.cataloguing.checkedDate && (
                  <div className="meta-item">
                    <span className="meta-label">Checked Date</span>
                    <span className="meta-value">{book.cataloguing.checkedDate}</span>
                  </div>
                )}
                {book.cataloguing.cip && (
                  <div className="meta-item">
                    <span className="meta-label">CIP</span>
                    <span className="meta-value">{book.cataloguing.cip}</span>
                  </div>
                )}
              </div>
              {book.cataloguing.originalCataloguing && (
                <p style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '0.5rem' }}>
                  <List size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  This is the original cataloguing of this book.
                </p>
              )}
            </div>
          )}

          <div className="copies-section">
            <h3>Copies ({book.totalCopies} total)</h3>
            <div className="copies-list">
              {(book.copies || []).map(copy => (
                <div key={copy.id} className="copy-item">
                  <div>
                    <strong>{copy.id || copy.code}</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                      {copy.locationString || makeLocationString(copy.location || book)}
                    </p>
                    {copy.callNumber && (
                      <p style={{ fontSize: '0.8rem', margin: '0.15rem 0 0' }}>
                        <span style={{ fontWeight: 600 }}>Call No: </span>
                        <code>{copy.callNumber}</code>
                      </p>
                    )}
                    {copy.physicalLocation && (
                      <p
                        className={`physical-location-copy ${copy.physicalLocation.mapped ? '' : 'physical-location-copy--unmapped'}`}
                        title={copy.physicalLocation.text}
                      >
                        <Milestone size={13} />
                        {copy.physicalLocation.mapped
                          ? `Pillar ${copy.physicalLocation.pillar} · ${copy.physicalLocation.subject}${copy.physicalLocation.arrow ? ` · ${copy.physicalLocation.arrow} side` : ''}`
                          : copy.physicalLocation.text}
                      </p>
                    )}
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

          {book.physicalLocation && (
            <div className={`physical-location-card ${book.physicalLocation.mapped ? '' : 'physical-location-card--unmapped'}`}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Milestone size={18} style={{ color: 'var(--primary)' }} />
                Physical Location Guide
              </h3>
              <p style={{ color: 'var(--text)', fontSize: '1rem', lineHeight: 1.6, marginTop: '0.75rem' }}>
                {book.physicalLocation.text}
              </p>
              {book.physicalLocation.mapped && (
                <Link
                  to={`/books/${book.id}/location`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginTop: '0.75rem', textDecoration: 'none', fontWeight: 500 }}
                >
                  <MapPin size={16} />
                  Get step-by-step directions
                </Link>
              )}
            </div>
          )}

          <div className="book-actions">
            <Link to={`/books/${book.id}/location`}>
              <Button>
                <MapPin size={18} />
                See Exact Location
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;