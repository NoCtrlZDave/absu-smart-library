import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Filter, BookOpen, SlidersHorizontal } from 'lucide-react';
import { Button, Input, Pagination } from '../../components/common';
import { CATEGORIES } from '../../data/books';
import { useBooks } from '../../context/useBook';
import './Public.css';

const Search = () => {
  const { books: allBooks } = useBooks();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All Categories');
  const [availability, setAvailability] = useState('all');
  const [yearRange, setYearRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const booksPerPage = 8;

  const categories = ['All Categories', ...CATEGORIES];

  const filteredBooks = allBooks.filter(book => {
    const matchesQuery = query === '' ||
      book.title.toLowerCase().includes(query.toLowerCase()) ||
      book.author.toLowerCase().includes(query.toLowerCase()) ||
      book.isbn.includes(query) ||
      (book.subjects && book.subjects.some(subject => subject.toLowerCase().includes(query.toLowerCase())));
    const matchesCategory = selectedCategory === 'All Categories' || book.category === selectedCategory;
    const matchesAvailability = availability === 'all' ||
      (availability === 'available' && book.available) ||
      (availability === 'borrowed' && !book.available);
    const matchesYear = yearRange === 'all' ||
      (yearRange === '2023' && book.year === 2023) ||
      (yearRange === '2021-2022' && (book.year === 2021 || book.year === 2022)) ||
      (yearRange === 'older' && book.year < 2021);
    return matchesQuery && matchesCategory && matchesAvailability && matchesYear;
  });

  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);
  const startIndex = (currentPage - 1) * booksPerPage;
  const currentBooks = filteredBooks.slice(startIndex, startIndex + booksPerPage);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <div className="search-header-content">
          <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: '1rem' }}>
            <Input
              type="text"
              placeholder="Search books by title, author, ISBN, or subject..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              icon={SearchIcon}
            />
            <Button type="submit">Search</Button>
          </form>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="mobile-filter-btn"
          >
            <SlidersHorizontal size={18} />
            Filters
          </Button>
        </div>
      </div>

      <div className="search-content">
        <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
          <h3>
            <Filter size={18} />
            Filters
          </h3>

          <div className="filter-group">
            <h4>Category</h4>
            {categories.map(cat => (
              <label key={cat} className="filter-option">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === cat}
                  onChange={() => setSelectedCategory(cat)}
                />
                {cat}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4>Availability</h4>
            <label className="filter-option">
              <input type="radio" name="availability" checked={availability === 'all'} onChange={() => setAvailability('all')} />
              All
            </label>
            <label className="filter-option">
              <input type="radio" name="availability" checked={availability === 'available'} onChange={() => setAvailability('available')} />
              Available
            </label>
            <label className="filter-option">
              <input type="radio" name="availability" checked={availability === 'borrowed'} onChange={() => setAvailability('borrowed')} />
              Borrowed
            </label>
          </div>

          <div className="filter-group">
            <h4>Publication Year</h4>
            <label className="filter-option">
              <input type="radio" name="year" checked={yearRange === 'all'} onChange={() => setYearRange('all')} />
              All Years
            </label>
            <label className="filter-option">
              <input type="radio" name="year" checked={yearRange === '2023'} onChange={() => setYearRange('2023')} />
              2023
            </label>
            <label className="filter-option">
              <input type="radio" name="year" checked={yearRange === '2021-2022'} onChange={() => setYearRange('2021-2022')} />
              2021 - 2022
            </label>
            <label className="filter-option">
              <input type="radio" name="year" checked={yearRange === 'older'} onChange={() => setYearRange('older')} />
              Older
            </label>
          </div>

          <Button variant="outline" onClick={() => { setSelectedCategory('All Categories'); setAvailability('all'); setYearRange('all'); setQuery(''); }} style={{ width: '100%' }}>
            Clear Filters
          </Button>
        </aside>

        <div className="search-results">
          <div className="results-header">
            <span className="results-count">
              Showing {filteredBooks.length} results
              {query && ` for "${query}"`}
            </span>
            <div className="results-sort">
              <select>
                <option>Sort by Relevance</option>
                <option>Sort by Title (A-Z)</option>
                <option>Sort by Year (Newest)</option>
                <option>Sort by Author</option>
              </select>
            </div>
          </div>

          {currentBooks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No books found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="results-grid">
                {currentBooks.map(book => (
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
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
