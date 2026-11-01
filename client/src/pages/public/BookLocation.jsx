import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowLeft, Building2, Layers, Milestone, BookOpen,
  MapPin, ImageIcon, HelpCircle,
} from 'lucide-react';
import { Button, BookCover, Badge } from '../../components/common';
import { useBooks } from '../../context/useBook';
import { availabilityVariant, reservedAvailableLabel, totalCopiesLabel } from '../../utils/availability';
import './Public.css';

const STEP_ICON = {
  library: Building2,
  floor: Layers,
  pillar: Milestone,
  book: BookOpen,
};

const STEP_LABEL = {
  library: 'Library',
  floor: 'Floor',
  pillar: 'Pillar',
  book: 'Book',
};

const BookLocation = () => {
  const { id } = useParams();
  const { getBook } = useBooks();
  const [book, setBook] = useState(null);

  useEffect(() => {
    getBook(id).then(setBook);
  }, [id, getBook]);

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

  const phys = book.physicalLocation;
  const mapped = Boolean(phys && phys.mapped);
  const library = book.location?.library || 'Main Library';
  const floor = phys?.floor ? `Floor ${phys.floor}` : (book.location?.floor || 'Floor 1');

  const guideSteps = mapped ? (phys.guide || []) : [];
  const steps = [
    ...guideSteps,
    ...(guideSteps.length
      ? [{
          kind: 'book',
          title: 'The Book',
          text: `Look for "${book.title}" on the shelves. Check the call number printed on the spine to confirm you have the right copy. If you can't find it, ask a librarian for assistance.`,
          caption: `${book.title} by ${book.author}`,
        }]
      : []),
  ];

  const renderLegacySteps = () => {
    if (!phys) return null;
    return (
      <div className="physical-navigation">
        <h2>
          <Milestone size={20} />
          Physical Location Guide
        </h2>
        <p className="physical-navigation__summary">{phys.text}</p>
        <ol className="physical-navigation__steps">
          <li>Go to <strong>Pillar {phys.pillar}</strong>.</li>
          <li>
            Look for the sign <strong>{phys.prefix} - {phys.subject}</strong>
            {phys.notes && <> <span className="physical-navigation__note">({phys.notes})</span></>}
          </li>
          {phys.arrow && (
            <li>The books are on the <strong>{phys.arrow}</strong> side of the pillar.</li>
          )}
        </ol>
      </div>
    );
  };

  const renderUnmapped = () => (
    <div className="physical-navigation physical-navigation--unmapped">
      <h2>
        <HelpCircle size={20} />
        Physical Location Guide
      </h2>
      <p>{phys?.text || 'Location not mapped yet. Please ask a librarian for assistance.'}</p>
    </div>
  );

  return (
    <div className="book-location">
      <Link to={`/books/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '1.5rem', textDecoration: 'none', fontWeight: 500 }}>
        <ArrowLeft size={18} />
        Back to Book Details
      </Link>

      <div className="location-card">
        <div className="location-header">
          <div className="location-header__book">
            <BookCover book={book} size="small" />
            <div>
              <h1>Book Location</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {book.title} by {book.author}
              </p>
            </div>
          </div>
        </div>

        {mapped ? (
          <>
            <div className="location-path">
              <div className="location-node">
                <div className="location-node-icon"><Building2 size={24} /></div>
                <span className="location-node-label">Library</span>
                <span className="location-node-value">{library}</span>
              </div>

              <div className="location-connector">›</div>

              <div className="location-node">
                <div className="location-node-icon"><Layers size={24} /></div>
                <span className="location-node-label">Floor</span>
                <span className="location-node-value">{floor}</span>
              </div>

              <div className="location-connector">›</div>

              <div className="location-node">
                <div className="location-node-icon"><Milestone size={24} /></div>
                <span className="location-node-label">Pillar</span>
                <span className="location-node-value">Pillar {phys.pillar}</span>
              </div>

              <div className="location-connector">›</div>

              <div className="location-node active">
                <div className="location-node-icon"><BookOpen size={24} /></div>
                <span className="location-node-label">Book</span>
                <span className="location-node-value">{phys.subject}</span>
              </div>
            </div>

            {steps.length > 0 ? (
              <div className="location-guide">
                <div className="location-guide__heading">
                  <h2>
                    <MapPin size={20} />
                    Step-by-Step Directions
                  </h2>
                  <p>Follow these steps and the photos to find your book.</p>
                </div>

                <ol className="location-guide__timeline">
                  {steps.map((step, i) => {
                    const Icon = STEP_ICON[step.kind] || MapPin;
                    const label = STEP_LABEL[step.kind] || `Step ${i + 1}`;
                    return (
                      <li key={`${step.kind}-${i}`} className="location-step">
                        <div className="location-step__badge">
                          <Icon size={20} />
                          <span className="location-step__label">{label}</span>
                        </div>
                        <div className="location-step__body">
                          <div className="location-step__num">Step {i + 1}</div>
                          <h3 className="location-step__title">{step.title}</h3>
                          <p className="location-step__text">{step.text}</p>
                          <div className="location-step__media">
                            {step.kind === 'book' && book.coverImage ? (
                              <img src={book.coverImage} alt={book.title} className="location-step__image" />
                            ) : step.kind === 'book' ? (
                              <div className="location-step__cover">
                                <BookCover book={book} size="large" />
                              </div>
                            ) : step.image ? (
                              <img src={step.image} alt={step.caption || step.title} className="location-step__image" />
                            ) : (
                              <div className="location-step__placeholder">
                                <ImageIcon size={28} />
                                <span>Photo coming soon</span>
                              </div>
                            )}
                            {step.caption && <div className="location-step__caption">{step.caption}</div>}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>

                <div className="location-guide__final">
                  <BookCover book={book} size="medium" />
                  <div>
                    <h3>You found it!</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
                      {book.title} lives at {floor}, {phys.subject}
                      {phys.arrow ? ` - ${phys.arrow} side` : ''} of Pillar {phys.pillar}.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <Badge variant={availabilityVariant(book)}>{reservedAvailableLabel(book)}</Badge>
                      <Badge variant="info">{totalCopiesLabel(book)} total</Badge>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              renderLegacySteps()
            )}
          </>
        ) : (
          renderUnmapped()
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to={`/books/${id}`}>
            <Button>
              <MapPin size={18} />
              Return to Book Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookLocation;