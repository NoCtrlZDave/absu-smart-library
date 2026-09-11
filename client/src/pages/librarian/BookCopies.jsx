import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Copy, MapPin, Pencil, Trash2, Search } from 'lucide-react';
import { Button, Input, Select, Modal, EmptyState } from '../../components/common';
import { useAudit } from '../../context/useAudit';
import { useToast } from '../../components/common/useToast';
import { useBooks } from '../../context/useBook';
import { makeLocationString } from '../../data/books';
import './Librarian.css';

const COPY_STATUSES = ['available', 'borrowed', 'reserved', 'damaged', 'missing', 'misplaced'];

const makeCopyId = (book) => {
  const existing = (book.copies || []).map((c) => c.id);
  const base = `CP-${book.id}`;
  let n = (book.copies || []).length + 1;
  while (existing.includes(`${base}-${String(n).padStart(3, '0')}`)) n += 1;
  return `${base}-${String(n).padStart(3, '0')}`;
};

const statusBadge = (status) => {
  const map = {
    available: 'badge-success',
    borrowed: 'badge-danger',
    reserved: 'badge-warning',
    damaged: 'badge-warning',
    missing: 'badge-info',
    misplaced: 'badge-info',
  };
  return `badge ${map[status] || 'badge-info'}`;
};

const locationText = (loc) => {
  if (!loc) return 'Location not assigned';
  if (typeof loc === 'string') return loc.trim() || 'Location not assigned';
  return [loc.floor, loc.section, loc.rack, loc.shelf].filter(Boolean).join(', ') || 'Main Library';
};

const toServerCopy = (c) => ({
  id: c.id,
  accessionNumber: c.accessionNumber,
  callNumber: c.callNumber,
  copyNumber: c.copyNumber,
  status: c.status,
  rfidTag: c.rfidTag,
  borrower: c.borrower,
  dueDate: c.dueDate,
  reservedBy: c.reservedBy,
  condition: c.condition,
  location: c.locationString || c.location || null,
});

const toPayload = (b, copies) => ({
  title: b.title,
  subtitle: b.subtitle,
  edition: b.edition,
  authors: b.authors,
  isbn: b.isbn,
  publisher: b.publisher,
  placeOfPublication: b.placeOfPublication || b.place,
  year: b.year,
  category: b.category,
  department: b.department,
  description: b.description,
  subjects: b.subjects,
  keywords: b.keywords,
  physicalDescription: b.physicalDescription,
  notes: b.notes,
  format: b.format,
  coverImage: b.coverImage,
  location: b.location || {},
  cataloguedBy: b.cataloguing?.cataloguedBy,
  cataloguedDate: b.cataloguing?.cataloguedDate,
  checkedBy: b.cataloguing?.checkedBy,
  checkedDate: b.cataloguing?.checkedDate,
  originalCataloguing: b.cataloguing?.originalCataloguing,
  cip: b.cataloguing?.cip,
  copies: (copies || []).map(toServerCopy),
});

const BookCopies = ({ basePath = '/librarian' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { books, updateBook } = useBooks();
  const { audit } = useAudit();
  const showToast = useToast();

  const boundBookId = id ? String(id) : null;
  const sourceBook = useMemo(
    () => (boundBookId ? books.find((b) => String(b.id) === boundBookId) || null : null),
    [books, boundBookId]
  );

  const [filterBookId, setFilterBookId] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [copyToDelete, setCopyToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  const filteredSource = filterBookId
    ? books.find((b) => String(b.id) === String(filterBookId)) || null
    : null;

  const rows = useMemo(() => {
    const all = books.flatMap((b) =>
      (b.copies || []).map((copy) => ({
        ...copy,
        _bookId: String(b.id),
        _bookTitle: b.title,
        _location: copy.locationString || locationText(copy.location),
      }))
    );
    const active = sourceBook
      ? all.filter((r) => r._bookId === String(sourceBook.id))
      : filteredSource
        ? all.filter((r) => r._bookId === String(filteredSource.id))
        : all;
    return active;
  }, [books, sourceBook, filteredSource]);

  const filteredRows = rows.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return [r.id, r._bookTitle, r._location, r.borrower, r.reservedBy, r.status]
      .join(' ')
      .toLowerCase()
      .includes(q);
  });

  const available = rows.filter((c) => c.status === 'available').length;

  const persistCopies = async (book, nextCopies) => {
    setSaving(true);
    try {
      await updateBook(book.id, toPayload(book, nextCopies));
      return true;
    } catch (err) {
      showToast(err.message || 'Failed to update copies', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    const { _bookId, id: copyId } = copyToDelete;
    const book = books.find((b) => String(b.id) === _bookId);
    if (!book) return;
    const next = (book.copies || []).filter((c) => String(c.id) !== String(copyId));
    const okNow = await persistCopies(book, next);
    if (!okNow) return;
    audit('Delete', 'Book Copy', `Removed copy ${copyId} of "${book.title}"`);
    showToast(`Copy ${copyId} removed.`);
    setShowDeleteModal(false);
    setCopyToDelete(null);
  };

  const handleSaveCopy = async (payload) => {
    const { bookId, copyId, status, location, borrower, reservedBy, dueDate } = payload;
    const book = books.find((b) => String(b.id) === String(bookId));
    if (!book) return;
    const exists = (book.copies || []).some((c) => String(c.id) === String(copyId));
    const newCopy = {
      id: copyId,
      status,
      location,
      borrower,
      reservedBy,
      dueDate,
    };
    const next = exists
      ? (book.copies || []).map((c) => (String(c.id) === String(copyId) ? { ...c, ...newCopy } : c))
      : [...(book.copies || []), newCopy];
    const okNow = await persistCopies(book, next);
    if (!okNow) return;
    audit(exists ? 'Update' : 'Add', 'Book Copy', `${exists ? 'Updated' : 'Added'} copy ${copyId} of "${book.title}"`);
    showToast(`Copy ${copyId} ${exists ? 'updated' : 'added'}.`);
  };

  const editBook = editTarget
    ? books.find((b) => String(b.id) === String(editTarget._bookId)) || null
    : null;

  return (
    <div className="librarian-page">
      <button
        onClick={() => navigate(`${basePath}/books`)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
      >
        <ArrowLeft size={18} />
        Back to Books
      </button>

      <div className="page-header">
        <h1>Book Copies</h1>
        <p>
          {sourceBook
            ? `${sourceBook.title} (Book ID: ${sourceBook.id})`
            : 'Manage copies across the entire book collection.'}
        </p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left" style={{ maxWidth: '600px' }}>
          <Input
            placeholder="Search by copy ID, book, borrower, or location..."
            icon={Search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {!boundBookId && (
            <Select value={filterBookId} onChange={(e) => setFilterBookId(e.target.value)}>
              <option value="">All Books</option>
              {books
                .filter((b) => (b.copies || []).length)
                .map((b) => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
            </Select>
          )}
        </div>
        <div className="toolbar-right">
          <p style={{ color: 'var(--text-secondary)', marginRight: '1rem' }}>
            {available} of {rows.length} copies available
          </p>
          <Button onClick={() => setShowAddModal(true)} disabled={!books.length}>
            <Plus size={18} />
            Add Copy
          </Button>
        </div>
      </div>

      <div className="content-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {!boundBookId && <th>Book</th>}
                <th>Copy ID</th>
                <th>Status</th>
                <th>Location</th>
                <th>Borrower</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((copy) => (
                <tr key={`${copy._bookId}-${copy.id}`}>
                  {!boundBookId && (
                    <td><strong>{copy._bookTitle}</strong></td>
                  )}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Copy size={16} style={{ color: 'var(--primary)' }} />
                      <strong>{copy.id}</strong>
                    </div>
                  </td>
                  <td>
                    <span className={statusBadge(copy.status)}>
                      {copy.status.charAt(0).toUpperCase() + copy.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={14} />
                      {copy._location}
                    </div>
                  </td>
                  <td>{copy.borrower || copy.reservedBy || '-'}</td>
                  <td>{copy.dueDate || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="action-btn" title="Edit" onClick={() => setEditTarget({ _bookId: copy._bookId, copy })}>
                        <Pencil size={16} />
                      </button>
                      <button className="action-btn danger" title="Delete" onClick={() => { setCopyToDelete(copy); setShowDeleteModal(true); }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filteredRows.length && (
            <EmptyState title="No copies found" description="Try adjusting your search or add a new copy." />
          )}
        </div>
      </div>

      {showAddModal && (
        <CopyFormModal
          sourceBook={sourceBook}
          books={books}
          boundBookId={boundBookId}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveCopy}
        />
      )}

      {editTarget && editBook && (
        <CopyFormModal
          key={editTarget.copy.id}
          existing={editTarget.copy}
          sourceBook={editBook}
          books={books}
          boundBookId={boundBookId}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveCopy}
        />
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Copy"
      >
        <p>Are you sure you want to delete copy {copyToDelete?.id}? This action cannot be undone.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete} disabled={saving} loading={saving}>
            <Trash2 size={18} />
            Delete Copy
          </Button>
        </div>
      </Modal>
    </div>
  );
};

const CopyFormModal = ({
  onClose,
  onSave,
  sourceBook,
  books,
  boundBookId,
  existing,
}) => {
  const showToast = useToast();
  const isEdit = Boolean(existing);
  const [bookId, setBookId] = useState(() =>
    existing
      ? String(existing._bookId)
      : sourceBook
        ? String(sourceBook.id)
        : boundBookId
          ? String(boundBookId)
          : books[0]
            ? String(books[0].id)
            : ''
  );
  const [copyId, setCopyId] = useState(existing?.id || (sourceBook ? makeCopyId(sourceBook) : ''));
  const [status, setStatus] = useState(existing?.status || 'available');
  const [location, setLocation] = useState(
    existing?.locationString || existing?.location
      ? existing.locationString || locationText(existing.location)
      : (sourceBook ? makeLocationString(sourceBook) : '')
  );
  const [borrower, setBorrower] = useState(existing?.borrower || existing?.reservedBy || '');
  const [dueDate, setDueDate] = useState(existing?.dueDate || '');

  const book =
    existing && sourceBook
      ? sourceBook
      : books.find((b) => String(b.id) === (boundBookId ? String(boundBookId) : bookId)) || null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalBookId = existing ? existing._bookId : String(boundBookId || bookId);
    const finalBook = existing ? sourceBook : book;
    if (!finalBookId || !finalBook) {
      showToast('Please select a book.', 'error');
      return;
    }
    if (!copyId.trim()) {
      showToast('Copy ID is required.', 'error');
      return;
    }
    onSave({
      bookId: finalBookId,
      copyId: copyId.trim(),
      status,
      location: location.trim() || makeLocationString(finalBook),
      borrower: status === 'borrowed' ? borrower.trim() : undefined,
      reservedBy: status === 'reserved' ? borrower.trim() : undefined,
      dueDate: status === 'borrowed' && dueDate ? dueDate : undefined,
    });
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Edit Copy' : 'Add Copy'}>
      <form onSubmit={handleSubmit} noValidate>
        {!boundBookId && !isEdit && (
          <Select
            label="Book"
            value={bookId}
            onChange={(e) => {
              setBookId(e.target.value);
              const b = books.find((x) => String(x.id) === e.target.value);
              if (b) {
                setCopyId(makeCopyId(b));
                setLocation(makeLocationString(b));
              }
            }}
          >
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.title}</option>
            ))}
          </Select>
        )}
        {!isEdit && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            {boundBookId || sourceBook
              ? 'Adding a copy for the selected book.'
              : 'Select the book this copy belongs to.'}
          </p>
        )}

        <Input
          label="Copy ID"
          value={copyId}
          onChange={(e) => setCopyId(e.target.value)}
          placeholder="e.g. CS-006"
          disabled={isEdit}
        />
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          {COPY_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </Select>
        <Input
          label="Shelf Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Floor 3, Section A, Rack 2, Shelf 4"
        />
        {(status === 'borrowed' || status === 'reserved') && (
          <>
            <Input
              label={status === 'borrowed' ? 'Borrower' : 'Reserved By'}
              value={borrower}
              onChange={(e) => setBorrower(e.target.value)}
              placeholder="Student name"
            />
            {status === 'borrowed' && (
              <Input
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Save Changes' : 'Add Copy'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default BookCopies;