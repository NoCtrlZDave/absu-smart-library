import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search as SearchIcon,
  Filter,
  BookOpen,
  MapPin,
  SlidersHorizontal,
  X,
} from 'lucide-react';
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
  const [selectedDepartment, setSelectedDepartment] = useState(searchParams.get('department') || 'All Departments');
  const [selectedAvailability, setSelectedAvailability] = useState(searchParams.get('availability') || 'All');
  const [selectedYear, setSelectedYear] = useState(searchParams.get('year') || 'All Years');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [books, setBooks] = useState([]);
  const [facets, setFacets] = useState({ categories: [], departments: [], years: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const booksPerPage = 9;

  useEffect(() => {
    let mounted = true;
    const params = {};
    if (query.trim()) params.q = query.trim();
    if (selectedCategory !== 'All Categories') params.category = selectedCategory;
    if (selectedDepartment !== 'All Departments') params.department = selectedDepartment;
    if (selectedAvailability !== 'All') params.availability = selectedAvailability.toLowerCase();
    if (selectedYear !== 'All Years') params.year = selectedYear;
    params.sort = sortBy;
    params.page = currentPage;
    params.limit = booksPerPage;

    setSearchParams(params, { replace: true });
    setLoading(true);
    setError(null);

    booksApi.list(params)
      .then((data) => {
        if (!mounted) return;
        setBooks(data.books || []);
        setFacets(data.facets || { categories: [], departments: [], years: [], total: 0 });
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [query, selectedCategory, selectedDepartment, selectedAvailability, selectedYear, sortBy, currentPage, setSearchParams]);

  const categoryOptions = ['All Categories', ...(facets.categories || []).map((c) => c.name)];
  const departmentOptions = ['All Departments', ...(facets.departments || []).map((d) => d.name || d)];
  const yearOptions = ['All Years', ...(facets.years || []).map((y) => String(y.year || y.name))];
  const availabilityOptions = ['All', 'Available', 'Borrowed'];
  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'title', label: 'Title (A-Z)' },
    { value: 'author', label: 'Author (A-Z)' },
    { value: 'year', label: 'Year (Newest)' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(inputValue.trim());
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setQuery('');
    setInputValue('');
    setSelectedCategory('All Categories');
    setSelectedDepartment('All Departments');
    setSelectedAvailability('All');
    setSelectedYear('All Years');
    setSortBy('relevance');
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
        <div
          className={`filters-backdrop ${showFilters ? 'show' : ''}`}
          onClick={() => setShowFilters(false)}
          aria-hidden="true"
        />
        <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
          <div className="filters-sidebar-header">
            <h3>
              <Filter size={18} />
              Filters
            </h3>
            <button
              type="button"
              className="filters-close-btn"
              onClick={() => setShowFilters(false)}
              aria-label="Close filters"
            >
              <X size={20} />
            </button>
          </div>

          <div className="filter-group">
            <h4>Category</h4>
            {categoryOptions.map(cat => (
              <label key={cat} className="filter-option">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === cat}
                  onChange={() => { setSelectedCategory(cat); setCurrentPage(1); setShowFilters(false); }}
                />
                {cat} {cat !== 'All Categories' && `(${facets.categories?.find((c) => c.name === cat)?.count ?? ''})`}
              </label>
            ))}
          </div>

          <Button variant="outline" onClick={clearFilters} style={{ width: '100%' }}>
            Clear Filters
          </Button>

          <div className="filter-group">
            <h4>Department</h4>
            {departmentOptions.map(dept => (
              <label key={dept} className="filter-option">
                <input
                  type="radio"
                  name="department"
                  checked={selectedDepartment === dept}
                  onChange={() => { setSelectedDepartment(dept); setCurrentPage(1); setShowFilters(false); }}
                />
                {dept}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4>Availability</h4>
            {availabilityOptions.map(avail => (
              <label key={avail} className="filter-option">
                <input
                  type="radio"
                  name="availability"
                  checked={selectedAvailability === avail}
                  onChange={() => { setSelectedAvailability(avail); setCurrentPage(1); setShowFilters(false); }}
                />
                {avail}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4>Publication Year</h4>
            {yearOptions.map(year => (
              <label key={year} className="filter-option">
                <input
                  type="radio"
                  name="year"
                  checked={selectedYear === year}
                  onChange={() => { setSelectedYear(year); setCurrentPage(1); setShowFilters(false); }}
                />
                {year}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4>Sort By</h4>
            {sortOptions.map(opt => (
              <label key={opt.value} className="filter-option">
                <input
                  type="radio"
                  name="sort"
                  checked={sortBy === opt.value}
                  onChange={() => { setSortBy(opt.value); setCurrentPage(1); setShowFilters(false); }}
                />
                {opt.label}
              </label>
            ))}
          </div>
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