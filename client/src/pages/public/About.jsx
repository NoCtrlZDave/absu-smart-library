import { Building2, Target, BookOpen, Users, Mail, Phone, MapPin, Clock } from 'lucide-react';
import './Public.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="about-hero">
        <h1>About ABSU Digital Library</h1>
        <p>Empowering students with smart access to knowledge since 1980</p>
      </div>

      <div className="about-content">
        <div className="about-card">
          <h2>
            <Target size={20} />
            Our Mission
          </h2>
          <p>
            To provide seamless access to educational resources and foster a culture of learning 
            through innovative library services. We aim to support academic excellence by offering 
            comprehensive collections, modern facilities, and digital services that meet the evolving 
            needs of our university community.
          </p>
        </div>

        <div className="about-card">
          <h2>
            <BookOpen size={20} />
            Our Collection
          </h2>
          <p>
            Our library houses over 50,000 books, journals, and digital resources spanning all 
            academic disciplines. From engineering and computer science to medicine and law, we 
            provide resources that support cutting-edge research and learning. Our collection is 
            continuously updated to include the latest publications and editions.
          </p>
        </div>

        <div className="about-card">
          <h2>
            <Users size={20} />
            Who We Serve
          </h2>
          <p>
            We serve the entire university community including undergraduate students, postgraduate 
            students, faculty members, and researchers. Our services are designed to accommodate 
            diverse learning styles and research needs, with both physical and digital access options 
            available 24/7.
          </p>
        </div>
      </div>

      <div className="about-card" style={{ marginBottom: '2rem' }}>
        <h2>
          <Building2 size={20} />
          Library Features
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
          <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Smart Book Locator</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Find any book's exact location with our visual shelf guide system.
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Online Reservations</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Reserve books online before visiting the library.
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Real-time Availability</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Check book availability status in real-time.
            </p>
          </div>
          <div style={{ padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Digital Resources</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Access e-books, journals, and research papers online.
            </p>
          </div>
        </div>
      </div>

      <div className="about-card">
        <h2>
          <Mail size={20} />
          Contact Us
        </h2>
        <div className="contact-grid" style={{ marginTop: '1rem' }}>
          <div className="contact-item">
            <div className="contact-icon">
              <MapPin size={20} />
            </div>
            <div>
              <strong>Address</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                Abia State University, Uturu, Nigeria
              </p>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon">
              <Phone size={20} />
            </div>
            <div>
              <strong>Phone</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                +234 (0) 800 123 4567
              </p>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon">
              <Mail size={20} />
            </div>
            <div>
              <strong>Email</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                library@absu.edu.ng
              </p>
            </div>
          </div>
          <div className="contact-item">
            <div className="contact-icon">
              <Clock size={20} />
            </div>
            <div>
              <strong>Hours</strong>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                Mon - Fri: 8:00 AM - 9:00 PM
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
