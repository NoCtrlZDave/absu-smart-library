import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Book, Laptop, Stethoscope, Scale, Calculator, GraduationCap } from 'lucide-react';
import { useBooks } from '../../context/useBook';
import { BookCover } from '../../components/common';
import './Public.css';

const HOME_CATEGORIES = [
  { name: 'Engineering', icon: <Calculator size={24} /> },
  { name: 'Computer Science', icon: <Laptop size={24} /> },
  { name: 'Medicine', icon: <Stethoscope size={24} /> },
  { name: 'Law', icon: <Scale size={24} /> },
  { name: 'Business', icon: <Book size={24} /> },
  { name: 'Education', icon: <GraduationCap size={24} /> }
];

const Home = () => {
  const { books, categories } = useBooks();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const categoryCount = (name) =>
    categories.find((c) => c.name === name)?.count || 0;

  const featuredBooks = books.slice(0, 6);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-eyebrow">Abia State University · Smart Library</span>
          <h1>
            Find any book.
            <br />
            <span className="hero-title-accent">Pin its exact shelf.</span>
          </h1>
          <p>
            Search by title, author or ISBN — then walk straight to the pillar,
            rack and shelf. No login required.
          </p>
          <form className="hero-search" onSubmit={handleSearch}>
            <Search size={20} className="hero-search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by title, author, ISBN, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
          <div className="hero-chips">
            <span className="hero-chips-label">Popular:</span>
            <Link to="/search?category=Engineering">Engineering</Link>
            <Link to="/search?category=Computer Science">Computer Science</Link>
            <Link to="/search?category=Law">Law</Link>
            <Link to="/search" className="hero-chips-more">Browse all</Link>
          </div>
        </div>
        <div className="hero-orb hero-orb--gold" aria-hidden="true" />
        <div className="hero-orb hero-orb--navy" aria-hidden="true" />
      </section>

      <section className="section">
        <div className="section-title">
          <span className="section-eyebrow">Browse disciplines</span>
          <h2>Explore by Category</h2>
          <p>From Engineering to Law — our collection spans every faculty</p>
        </div>
        <div className="categories-grid">
          {HOME_CATEGORIES.map((category, index) => (
            <Link to={`/search?category=${category.name}`} key={index} className="category-card">
              <div className="category-icon">{category.icon}</div>
              <h3>{category.name}</h3>
              <p>{categoryCount(category.name)} books</p>
              <span className="category-card__arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section--alt">
        <div className="section-title">
          <span className="section-eyebrow">Hand-picked reads</span>
          <h2>Featured Books</h2>
          <p>Popular and recently added titles in our collection</p>
        </div>
        <div className="books-grid">
          {featuredBooks.map((book) => (
            <Link to={`/books/${book.id}`} key={book.id} className="book-card">
              <BookCover book={book} />
              <div className="book-info">
                <h3>{book.title}</h3>
                <p>{book.author}</p>
                <div className="book-meta">
                  <span className="book-year">{book.year}</span>
                  <span className={`badge ${book.available ? 'badge-success' : 'badge-danger'}`}>
                    {book.available ? 'Available' : 'Borrowed'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <span className="section-eyebrow">Simple workflow</span>
          <h2>How It Works</h2>
          <p>Three steps between you and the book you need</p>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Search & Discover</h3>
            <p>Use our smart search to find books by title, author, ISBN, or browse by category.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>See the Exact Location</h3>
            <p>Instantly see the exact floor, section, rack, and shelf of every book - no login required.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Walk In & Pick Up</h3>
            <p>Head straight to the shelf and grab the book the moment you arrive.</p>
          </div>
        </div>
      </section>

      <section className="section section--flush">
        <div className="info-section">
          <div className="info-item">
            <h3>50,000+</h3>
            <p>Books in Collection</p>
          </div>
          <div className="info-item">
            <h3>10,000+</h3>
            <p>Searchable Titles</p>
          </div>
          <div className="info-item">
            <h3>24/7</h3>
            <p>Online Access</p>
          </div>
          <div className="info-item">
            <h3>13</h3>
            <p>Physical Pillars</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="cta-band">
          <div className="cta-band__text">
            <h2>Ready to find your next read?</h2>
            <p>Search the catalogue, grab your shelf reference, and be in and out in minutes.</p>
          </div>
          <div className="cta-band__actions">
            <Link to="/search" className="cta-band__btn cta-band__btn--gold">Search the Catalogue</Link>
            <Link to="/about" className="cta-band__btn cta-band__btn--ghost">Learn More</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
