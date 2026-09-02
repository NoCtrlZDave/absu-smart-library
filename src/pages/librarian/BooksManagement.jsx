import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, BookOpen, Copy } from 'lucide-react';
import { Button, Input, Select, Modal } from '../../components/common';
import './Librarian.css';

const initialBooks = [
  { id: 1, title: 'Introduction to Algorithms', category: 'Computer Science', copies: 5, available: 3, status: 'available' },
  { id: 2, title: 'Engineering Mathematics', category: 'Engineering', copies: 4, available: 2, status: 'available' },
  { id: 3, title: 'Principles of Anatomy', category: 'Medicine', copies: 3, available: 0, status: 'borrowed' },
  { id: 4, title: 'Constitutional Law', category: 'Law', copies: 6, available: 4, status: 'available' },
  { id: 5, title: 'Organic Chemistry', category: 'Chemistry', copies: 4, available: 1, status: 'available' }
];

const BooksManagement = () => {
  const [books, setBooks] = useState(initialBooks);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  const categories = ['All', 'Computer Science', 'Engineering', 'Medicine', 'Law', 'Chemistry'];

  const filteredBooks = books.filter(book => {
    const matchesSearch = search === '' || 
      book.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || book.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || book.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDeleteClick = (book) => {
    setBookToDelete(book);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    setBooks(prev => prev.filter(b => b.id !== bookToDelete.id));
    setShowDeleteModal(false);
    setBookToDelete(null);
  };

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Books Management</h1>
        <p>Manage the library's book collection.</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Input
            placeholder="Search books..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            <option value="available">Available</option>
            <option value="borrowed">Borrowed</option>
          </Select>
        </div>
        <div className="toolbar-right">
          <Link to="/librarian/books/add">
            <Button>
              <Plus size={18} />
              Add Book
            </Button>
          </Link>
        </div>
      </div>

      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Category</th>
                <th>Copies</th>
                <th>Available</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map(book => (
                <tr key={book.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="book-cover-thumb">
                        <BookOpen size={16} />
                      </div>
                      <strong>{book.title}</strong>
                    </div>
                  </td>
                  <td>{book.category}</td>
                  <td>{book.copies}</td>
                  <td>{book.available}</td>
                  <td>
                    <span className={`badge ${book.status === 'available' ? 'badge-success' : 'badge-danger'}`}>
                      {book.status === 'available' ? 'Available' : 'Borrowed'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/librarian/books/${book.id}/copies`} title="Manage Copies">
                        <button className="action-btn">
                          <Copy size={16} />
                        </button>
                      </Link>
                      <Link to={`/librarian/books/${book.id}/edit`} title="Edit">
                        <button className="action-btn">
                          <Pencil size={16} />
                        </button>
                      </Link>
                      <button className="action-btn danger" onClick={() => handleDeleteClick(book)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Book"
      >
        <p>Are you sure you want to delete "{bookToDelete?.title}"? This action cannot be undone.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            <Trash2 size={18} />
            Delete Book
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default BooksManagement;
