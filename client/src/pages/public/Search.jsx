import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Filter, BookOpen, MapPin, SlidersHorizontal } from 'lucide-react';
import { Button, Pagination, BookCover } from '../../components/common';
import { booksApi } from '../../services/books';
import './Public.css';

const makeLocationString = (book) => {
  const loc = book.location || {};
  const parts = [loc.floor, loc.section, loc.rack, loc.shelf].filter(Boolean);
  return parts.length ? parts.join(', ') : (book.locationString || 'Location not set');
};

const makePhysicalLabel = (book) => {
  const phys = book.physicalLocation;
  if (!phys) return null;
  if (!phys.mapped) return phys.text;
  const direction = phys.arrow ? ` · ${phys.arrow} side` : '';
  return `Pillar ${phys.pillar} · ${phys.subject}${direction}`;
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All Categories');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [books, setBooks] = useState([]);
  const [facets, setFacets] = useState({ categories: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const booksPerPage = 9;

  useEffect(() => {
    let mounted = true;
    const params = {};
    if (query.trim()) params.q = query.trim();
    if (selectedCategory !== 'All Categories') params.category = selectedCategory;
    params.page = currentPage;
    params.limit = booksPerPage;

    setSearchParams(params, { replace: true });
    setLoading(true);
    setError(null);

    booksApi.list(params)
      .then((data) => {
        if (!mounted) return;
        setBooks(data.books || []);
        setFacets(data.facets || { categories: [], total: 0 });
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [query, selectedCategory, currentPage]);

  const categoryOptions = ['All Categories', ...(facets.categories || []).map((c) => c.name)];

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(inputValue.trim());
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil((facets.total || 0) / booksPerPage));

  return (
    <div className="search-page">
      <div className="search-header">
        <div className="search-header-content">
          <form onSubmit={handleSearch} className="search-header-form">
            <SearchIcon size={20} className="search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search books by title, author, ISBN, or subject..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit">Search</button>
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
            {categoryOptions.map(cat => (
              <label key={cat} className="filter-option">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === cat}
                  onChange={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                />
                {cat} {cat !== 'All Categories' && `(${facets.categories?.find((c) => c.name === cat)?.count ?? ''})`}
              </label>
            ))}
          </div>

          <Button variant="outline" onClick={() => { setSelectedCategory('All Categories'); setQuery(''); setInputValue(''); setCurrentPage(1); }} style={{ width: '100%' }}>
            Clear Filters
          </Button>
        </aside>

        <div className="search-results">
          <div className="results-header">
            <span className="results-count">
              {loading ? 'Searching...' : `${facets.total || 0} results`}
              {query && ` for "${query}"`}
            </span>
          </div>

          {error && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--danger)' }}>
              <p>Something went wrong: {error}</p>
            </div>
          )}

          {!error && books.length === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
              <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>No books found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="results-grid">
                {books.map(book => (
                  <Link to={`/books/${book.id}`} key={book.id} className="book-card">
                    <BookCover book={book} />
                    <div className="book-info">
                      <h3>{book.title}</h3>
                      <p>{book.author}</p>
                      <div className="book-meta">
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{book.year}</span>
                        <span className={`badge ${book.available ? 'badge-success' : 'badge-warning'}`}>
                          {book.available ? `${book.availableCopies} Available` : 'On Shelf'}
                        </span>
                      </div>
                      <div className="book-location-chip">
                        {makePhysicalLabel(book) ? (
                          <>
                            <MapPin size={14} />
                            {makePhysicalLabel(book)}
                          </>
                        ) : (
                          <>
                            <MapPin size={14} />
                            {makeLocationString(book)}
                          </>
                        )}
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