import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Hash, Building, Tag, ArrowLeft, BookOpen, BookMarked, Layers, FileText, Stamp, List, Milestone, LogIn, ChevronDown } from 'lucide-react';
import { Button, Badge, BookCover, EmptyState } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { useAuth } from '../../context/useAuth';
import { useBooks } from '../../context/useBook';
import { reservationsApi } from '../../services/reservations';
import { availabilityVariant, copyNoun, reservedAvailableLabel, totalCopiesLabel } from '../../utils/availability';
import './Public.css';
import '../Circulation.css';

const makeLocationString = (book) => {
  const loc = book.location || {};
  const parts = [loc.floor, loc.section, loc.rack, loc.shelf].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Location not set';
};

const copyStatusMeta = (status) => {
  const value = (status || 'unknown').toLowerCase();
  if (value === 'available') return { variant: 'success', tone: 'available', label: 'Available' };
  if (value === 'verified') return { variant: 'success', tone: 'available', label: 'Verified' };
  if (value === 'reserved') return { variant: 'info', tone: 'reserved', label: 'Reserved' };
  if (value === 'borrowed') return { variant: 'danger', tone: 'borrowed', label: 'On loan' };
  return { variant: 'maintenance', tone: 'unavailable', label: value.charAt(0).toUpperCase() + value.slice(1) };
};

const BookDetails = () => {
  const { id } = useParams();
  const { getBook, refreshCatalog } = useBooks();
  const { user } = useAuth();
  const showToast = useToast();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [reservationCreated, setReservationCreated] = useState(false);
  const [copiesOpen, setCopiesOpen] = useState(() =>
    typeof window === 'undefined' || !window.matchMedia('(max-width: 768px)').matches
  );

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

  const handleReserve = async () => {
    setReserving(true);
    try {
      await reservationsApi.create({ bookId: book.id });
      setReservationCreated(true);
      await refreshCatalog();
      showToast('Reservation request submitted. The library will review it.', 'success');
    } catch (err) {
      showToast(err.message || 'Could not submit reservation.', 'error');
    } finally {
      setReserving(false);
    }
  };

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

  const copies = book.copies || [];
  const copyCountLabel = `${copies.length} ${copyNoun(copies.length)}`;

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

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Badge variant={availabilityVariant(book)}>{reservedAvailableLabel(book)}</Badge>
            <Badge variant="info">{totalCopiesLabel(book)} total</Badge>
            {book.borrowedCopies > 0 && <Badge variant="warning">{book.borrowedCopies} On loan</Badge>}
            {book.unavailableCopies > 0 && (
              <Badge variant="maintenance">{book.unavailableCopies} Unavailable</Badge>
            )}
          </div>

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

          <div className={`copies-section ${copiesOpen ? 'copies-section--open' : ''}`}>
            <button
              type="button"
              className="copies-toggle"
              onClick={() => setCopiesOpen((open) => !open)}
              aria-expanded={copiesOpen}
              aria-controls="book-copies-panel"
            >
              <span className="copies-toggle__icon">
                <Layers size={18} />
              </span>
              <span className="copies-toggle__text">
                <span className="copies-toggle__title">Copies</span>
                <span className="copies-toggle__hint">View individual copies</span>
              </span>
              <span className="copies-toggle__summary">{copyCountLabel}</span>
              <ChevronDown className="copies-toggle__chevron" size={20} aria-hidden="true" />
            </button>

            <div
              className="copies-panel"
              id="book-copies-panel"
              aria-hidden={!copiesOpen}
            >
              <div className="copies-panel__inner">
                <div className="copies-panel__body">
                  {copies.length === 0 ? (
                    <EmptyState
                      icon={BookOpen}
                      title="No copies yet"
                      description="This book has no copies in the library catalogue."
                      className="copies-empty"
                    />
                  ) : (
                    <div className="copies-list">
                      {copies.map((copy) => {
                        const status = copyStatusMeta(copy.status);
                        return (
                          <div key={copy.id} className="copy-item">
                            <div className="copy-item-details">
                              <span className="copy-item-copyid">{copy.id || copy.code}</span>
                              <span className="copy-item-location">
                                {copy.locationString || makeLocationString(copy.location || book)}
                              </span>
                              {copy.callNumber && (
                                <span className="copy-item-callno">
                                  <span>Call No: </span>
                                  <code>{copy.callNumber}</code>
                                </span>
                              )}
                              {copy.physicalLocation && (
                                <span
                                  className={`physical-location-copy ${copy.physicalLocation.mapped ? '' : 'physical-location-copy--unmapped'}`}
                                  title={copy.physicalLocation.text}
                                >
                                  <Milestone size={13} />
                                  {copy.physicalLocation.mapped
                                    ? `Pillar ${copy.physicalLocation.pillar} · ${copy.physicalLocation.subject}${copy.physicalLocation.arrow ? ` · ${copy.physicalLocation.arrow} side` : ''}`
                                    : copy.physicalLocation.text}
                                </span>
                              )}
                            </div>
                            <span className="copy-item-status">
                              <span
                                className={`copy-status-dot copy-status-dot--${status.tone}`}
                                aria-hidden="true"
                              />
                              <Badge variant={status.variant} size="sm">{status.label}</Badge>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
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
            {user?.role === 'student' && !reservationCreated && (
              <Button
                onClick={handleReserve}
                loading={reserving}
                disabled={!book.totalCopies}
              >
                <BookMarked size={18} />
                {book.totalCopies ? 'Reserve this book' : 'No copies to reserve'}
              </Button>
            )}
            {user?.role === 'student' && reservationCreated && (
              <Link to="/student/reservations">
                <Button variant="success">
                  <BookMarked size={18} />
                  View reservation status
                </Button>
              </Link>
            )}
            {!user && book.totalCopies > 0 && (
              <Link to={`/login?redirect=/books/${book.id}`}>
                <Button variant="secondary">
                  <LogIn size={18} />
                  Sign in to reserve
                </Button>
              </Link>
            )}
            <Link to={`/books/${book.id}/location`}>
              <Button variant={user?.role === 'student' ? 'outline' : 'primary'}>
                <MapPin size={18} />
                See Exact Location
              </Button>
            </Link>
          </div>
          {user?.role === 'student' && (
            <p className="inline-note" style={{ marginTop: '1rem', marginBottom: 0 }}>
              A reservation request does not reduce available copies. A librarian must approve it
              and assign a physical copy before collection.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetails;