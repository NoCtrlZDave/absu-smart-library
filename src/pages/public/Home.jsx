import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BookOpen, Book, Laptop, Stethoscope, Scale, Calculator, GraduationCap } from 'lucide-react';
import { useBooks } from '../../context/useBook';
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
          <h1>ABSU Smart Library</h1>
          <p>Access thousands of books, journals, and academic resources at your fingertips</p>
          <form className="hero-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search by title, author, ISBN, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">
              <Search size={20} />
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <h2>Browse by Category</h2>
          <p>Explore our extensive collection across various disciplines</p>
        </div>
        <div className="categories-grid">
          {HOME_CATEGORIES.map((category, index) => (
            <Link to={`/search?category=${category.name}`} key={index} className="category-card">
              <div className="category-icon">{category.icon}</div>
              <h3>{category.name}</h3>
              <p>{categoryCount(category.name)} books</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" style={{ background: 'var(--background)' }}>
        <div className="section-title">
          <h2>Featured Books</h2>
          <p>Popular and recently added books in our collection</p>
        </div>
        <div className="books-grid">
          {featuredBooks.map((book) => (
            <Link to={`/books/${book.id}`} key={book.id} className="book-card">
              <div className="book-cover">
                <BookOpen size={48} />
              </div>
              <div className="book-info">
                <h3>{book.title}</h3>
                <p>{book.author}</p>
                <div className="book-meta">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{book.year}</span>
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
          <h2>How It Works</h2>
          <p>Simple steps to access library resources</p>
        </div>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Search & Discover</h3>
            <p>Use our smart search to find books by title, author, ISBN, or browse by category. Check real-time availability.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Reserve Online</h3>
            <p>Reserve books online before visiting. Get notified when your reserved book is ready for pickup.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Locate & Borrow</h3>
            <p>Find the exact location with our visual shelf guide. Scan and borrow in minutes.</p>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--surface)' }}>
        <div className="info-section">
          <div className="info-item">
            <h3>50,000+</h3>
            <p>Books in Collection</p>
          </div>
          <div className="info-item">
            <h3>10,000+</h3>
            <p>Registered Students</p>
          </div>
          <div className="info-item">
            <h3>24/7</h3>
            <p>Online Access</p>
          </div>
          <div className="info-item">
            <h3>5</h3>
            <p>Floor Library</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
