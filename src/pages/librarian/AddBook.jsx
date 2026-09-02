import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, BookOpen, Hash, User, Building2, Calendar, Save, ArrowLeft } from 'lucide-react';
import { Button, Input, Select } from '../../components/common';
import { CATEGORIES } from '../../data/books';
import { useBooks } from '../../context/useBook';
import { useToast } from '../../components/common/useToast';
import './Librarian.css';

const AddBook = () => {
  const navigate = useNavigate();
  const { addBook } = useBooks();
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: '',
    isbn: '',
    author: '',
    publisher: '',
    year: new Date().getFullYear(),
    category: '',
    description: ''
  });
  const [coverPreview, setCoverPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const categories = CATEGORIES;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast('Please enter a book title', 'error');
      return;
    }
    if (!formData.category) {
      toast('Please select a category', 'error');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const record = addBook({
        ...formData,
        location: {
          library: 'Main Library',
          floor: 'Floor 1',
          section: 'Section A',
          rack: 'Rack 1',
          shelf: 'Shelf 1'
        },
        subjects: formData.title.toLowerCase().split(/\s+/).slice(0, 5)
      });
      setSaving(false);
      toast(`"${record.title}" added to the catalogue`, 'success');
      navigate('/librarian/books');
    }, 600);
  };

  return (
    <div className="librarian-page">
      <button
        onClick={() => navigate('/librarian/books')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
      >
        <ArrowLeft size={18} />
        Back to Books
      </button>

      <div className="page-header">
        <h1>Add New Book</h1>
        <p>Add a new book to the library collection.</p>
      </div>

      <div className="content-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Book Title</label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter book title"
                    icon={BookOpen}
                  />
                </div>

                <div className="form-group">
                  <label>ISBN</label>
                  <Input
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                    placeholder="Enter ISBN number"
                    icon={Hash}
                  />
                </div>

                <div className="form-group">
                  <label>Author</label>
                  <Input
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    placeholder="Enter author name"
                    icon={User}
                  />
                </div>

                <div className="form-group">
                  <label>Publisher</label>
                  <Input
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleChange}
                    placeholder="Enter publisher"
                    icon={Building2}
                  />
                </div>

                <div className="form-group">
                  <label>Publication Year</label>
                  <Input
                    name="year"
                    type="number"
                    value={formData.year}
                    onChange={handleChange}
                    icon={Calendar}
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <Select name="category" value={formData.category} onChange={handleChange}>
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter book description..."
                  rows={5}
                  style={{
                    padding: '0.875rem',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                    background: 'var(--surface)',
                    color: 'var(--text)'
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Book Cover</label>
              <div className="upload-area" onClick={() => document.getElementById('cover-input').click()}>
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                ) : (
                  <>
                    <Upload size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
                    <p style={{ fontWeight: 500, color: 'var(--text)', marginBottom: '0.25rem' }}>
                      Click to upload book cover
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      PNG, JPG, or GIF (max. 5MB)
                    </p>
                  </>
                )}
              </div>
              <input
                id="cover-input"
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => navigate('/librarian/books')}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Book'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBook;
