import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, BookOpen, Copy } from 'lucide-react';
import { Button, Input, Select, Modal } from '../../components/common';
import { useBooks } from '../../context/useBook';
import { useAudit } from '../../context/useAudit';
import './Librarian.css';

const BooksManagement = ({ basePath = '/librarian' }) => {
  const { books, deleteBook, categories } = useBooks();
  const { audit } = useAudit();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  const statusOf = (book) =>
    (book.displayAvailableCopies ?? book.availableCopies) > 0 ? 'available' : 'borrowed';

  const categoryOptions = ['All', ...categories.map((c) => c.name)];

  const filteredBooks = books.filter(book => {
    const matchesSearch = search === '' ||
      book.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || book.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || statusOf(book) === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDeleteClick = (book) => {
    setBookToDelete(book);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    deleteBook(bookToDelete.id);
    audit('Delete', 'Book', `Deleted "${bookToDelete.title}"`);
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
            {categoryOptions.map(cat => (
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
          <Link to={`${basePath}/books/add`}>
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
                <th>Reserved</th>
                <th>Available</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map(book => {
                const copies = book.totalCopies;
                const reserved = book.displayReservedCopies ?? book.reservedCopies ?? 0;
                const available = book.displayAvailableCopies ?? book.availableCopies;
                const status = statusOf(book);
                return (
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
                    <td>{copies}</td>
                    <td>{reserved}</td>
                    <td>{available}</td>
                    <td>
                      <span className={`badge ${status === 'available' ? 'badge-success' : 'badge-danger'}`}>
                        {status === 'available' ? 'Available' : 'Borrowed'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to={`${basePath}/books/${book.id}/copies`} title="Manage Copies">
                          <button className="action-btn">
                            <Copy size={16} />
                          </button>
                        </Link>
                        <Link to={`${basePath}/books/${book.id}/edit`} title="Edit">
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
                );
              })}
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
