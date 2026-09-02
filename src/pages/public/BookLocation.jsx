import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Layers, Grid3X3, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common';
import './Public.css';

const locationData = {
  1: {
    bookId: 1,
    title: 'Introduction to Algorithms',
    library: 'Main Library',
    floor: 'Floor 3',
    floorNumber: 3,
    section: 'Section A',
    sectionName: 'Computer Science',
    rack: 'Rack 2',
    shelf: 'Shelf 4',
    description: 'This book is located in the Computer Science section on the 3rd floor of the Main Library.'
  },
  2: {
    bookId: 2,
    title: 'Engineering Mathematics',
    library: 'Main Library',
    floor: 'Floor 2',
    floorNumber: 2,
    section: 'Section B',
    sectionName: 'Engineering',
    rack: 'Rack 1',
    shelf: 'Shelf 3',
    description: 'This book is located in the Engineering section on the 2nd floor of the Main Library.'
  }
};

const defaultLocation = {
  bookId: 0,
  title: 'Sample Book',
  library: 'Main Library',
  floor: 'Floor 1',
  floorNumber: 1,
  section: 'Section A',
  sectionName: 'General',
  rack: 'Rack 1',
  shelf: 'Shelf 1',
  description: 'This is a sample location for demonstration purposes.'
};

const BookLocation = () => {
  const { id } = useParams();
  const location = locationData[id] || { ...defaultLocation, bookId: parseInt(id) };

  return (
    <div className="book-location">
      <Link to={`/book/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '1.5rem', textDecoration: 'none', fontWeight: 500 }}>
        <ArrowLeft size={18} />
        Back to Book Details
      </Link>

      <div className="location-card">
        <div className="location-header">
          <h1>Book Location</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {location.title}
          </p>
        </div>

        <div className="location-path">
          <div className="location-node">
            <div className="location-node-icon">
              <Building2 size={24} />
            </div>
            <span className="location-node-label">Library</span>
            <span className="location-node-value">{location.library}</span>
          </div>

          <span className="location-connector">
            <ArrowRight size={24} />
          </span>

          <div className="location-node">
            <div className="location-node-icon">
              <Layers size={24} />
            </div>
            <span className="location-node-label">Floor</span>
            <span className="location-node-value">{location.floor}</span>
          </div>

          <span className="location-connector">
            <ArrowRight size={24} />
          </span>

          <div className="location-node">
            <div className="location-node-icon">
              <Grid3X3 size={24} />
            </div>
            <span className="location-node-label">Section</span>
            <span className="location-node-value">{location.section}</span>
          </div>

          <span className="location-connector">
            <ArrowRight size={24} />
          </span>

          <div className="location-node active">
            <div className="location-node-icon">
              <BookOpen size={24} />
            </div>
            <span className="location-node-label">Rack - Shelf</span>
            <span className="location-node-value">{location.rack}, {location.shelf}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem', padding: '2rem', background: 'var(--background)', borderRadius: '12px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1rem' }}>
            {location.description}
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Section: {location.sectionName} | {location.floor} → {location.section} → {location.rack} → {location.shelf}
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to={`/book/${id}`}>
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
