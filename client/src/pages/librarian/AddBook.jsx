import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Upload, BookOpen, Hash, User, Building2, Calendar, Save, ArrowLeft,
  MapPin, Layers, Plus, Trash2, Boxes, FileText, Tag, Library, Stamp, Milestone,
} from 'lucide-react';
import { Button, Input, Select, Badge } from '../../components/common';
import { CATEGORIES } from '../../data/books';
import { useBooks } from '../../context/useBook';
import { useAudit } from '../../context/useAudit';
import { useAuth } from '../../context/useAuth';
import { useToast } from '../../components/common/useToast';
import { booksApi } from '../../services/books';
import { libraryApi } from '../../services/library';
import { locationApi } from '../../services/location';
import './Librarian.css';

const FORMATS = ['Paperback', 'Hardcover', 'E-book', 'Journal', 'Other'];
const COPY_STATUSES = ['available', 'borrowed', 'reserved', 'damaged', 'missing', 'misplaced'];

const flattenTree = (nodes) => {
  const out = [];
  (nodes || []).forEach((n) => {
    out.push(n);
    if (n.children && n.children.length) out.push(...flattenTree(n.children));
  });
  return out;
};

const ancestorsOf = (nodeId, byId) => {
  const ids = [];
  let cur = byId.get(nodeId);
  while (cur) {
    ids.unshift(cur.id);
    cur = cur.parent && byId.get(cur.parent) ? byId.get(cur.parent) : null;
  }
  return ids;
};

const shelfToLocation = (shelfId, byId) => {
  const ids = ancestorsOf(shelfId, byId);
  const names = ids.map((id) => byId.get(id)?.name).filter(Boolean);
  return {
    library: names[names.length - 1] || 'Main Library',
    floor: names[names.length - 2] || null,
    section: names[names.length - 3] || null,
    rack: names[names.length - 4] || null,
    shelf: names[names.length - 5] || null,
  };
};

const locationStringOf = (loc) => {
  if (!loc) return null;
  if (typeof loc === 'string') return loc.trim() || null;
  return [loc.floor, loc.section, loc.rack, loc.shelf].filter(Boolean).join(' → ') || null;
};

const copyKey = (copy) => {
  const loc = typeof copy.location === 'object' ? copy.location : {};
  return [loc.floor, loc.section, loc.rack, loc.shelf].filter(Boolean).join('|');
};

const today = () => new Date().toISOString().slice(0, 10);

const WORKSHEET_SAMPLE = {
  form: {
    title: 'Fundamentals of Food Process Engineering',
    subtitle: '',
    edition: '2nd edition',
    authors: 'Toledo, Romeo T.',
    isbn: '978-81-239-1551-7',
    publisher: 'CBS Publishers',
    placeOfPublication: 'New Delhi',
    year: 2000,
    category: 'Engineering',
    department: '',
    format: 'Paperback',
    physicalDescription: 'xiii, 566 p.; ill.; 21 cm',
    description: 'Includes appendix and index. A thorough treatment of food process engineering fundamentals.',
    notes: 'Includes appendix and index',
    subjects: 'food engineering, food process, unit operations',
  },
  cataloguing: {
    cataloguedBy: 'Asongye Divine-Favour Oluebube',
    cataloguedDate: '2025-12-11',
    checkedBy: '',
    checkedDate: '',
    originalCataloguing: true,
    cip: '',
  },
  copy: {
    code: 'FE-001',
    accessionNumber: '',
    callNumber: '',
    copyNumber: '1',
    status: 'available',
    rfidTag: '',
  },
};

const blankForm = () => ({
  title: '',
  subtitle: '',
  edition: '',
  authors: '',
  isbn: '',
  publisher: '',
  placeOfPublication: '',
  year: new Date().getFullYear(),
  category: '',
  department: '',
  format: '',
  physicalDescription: '',
  description: '',
  notes: '',
  subjects: '',
});

const blankCataloguing = (cataloguerName) => ({
  cataloguedBy: cataloguerName,
  cataloguedDate: today(),
  checkedBy: '',
  checkedDate: '',
  originalCataloguing: true,
  cip: '',
});

const AddBook = ({ basePath = '/librarian' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addBook, updateBook, getBook } = useBooks();
  const { audit } = useAudit();
  const { user } = useAuth();
  const toast = useToast();

  const editing = Boolean(id);
  const cataloguerName = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email : '';
  const initialSample = useMemo(() => ({ ...WORKSHEET_SAMPLE.form }), []);

  const [form, setForm] = useState(() => (editing ? blankForm() : initialSample));
  const [cataloguing, setCataloguing] = useState(() => (editing ? blankCataloguing(cataloguerName) : { ...WORKSHEET_SAMPLE.cataloguing, cataloguedBy: cataloguerName }));
  const [selectedShelf, setSelectedShelf] = useState('');
  const [copies, setCopies] = useState(() =>
    editing ? [] : [{ _key: `copy-${Date.now()}`, ...WORKSHEET_SAMPLE.copy, shelfId: '' }]
  );
  const [coverImage, setCoverImage] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [structure, setStructure] = useState([]);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryGuides, setCategoryGuides] = useState({});
  const [copyHints, setCopyHints] = useState({});
  const autoShelfId = useRef(null);

  const fallbackCategories = useMemo(
    () => CATEGORIES,
    []
  );

  const treeNodes = useMemo(() => flattenTree(structure), [structure]);
  const nodesById = useMemo(() => new Map(treeNodes.map((n) => [n.id, n])), [treeNodes]);
  const shelves = useMemo(() => treeNodes.filter((n) => n.type === 'shelf'), [treeNodes]);

  const shelfOptions = useMemo(() => {
    const opts = shelves.map((s) => {
      const loc = shelfToLocation(s.id, nodesById);
      const label = [loc.floor, loc.section, loc.rack, loc.shelf].filter(Boolean).join(' → ');
      return { value: s.id, label, key: copyKey({ location: loc }) };
    });
    opts.push({ value: '', label: 'Not assigned / use copy location', key: '' });
    return opts;
  }, [shelves, nodesById]);

  const pillarByShelfId = useMemo(() => {
    const map = {};
    shelves.forEach((s) => {
      const pillars = [];
      let cur = s;
      while (cur) {
        (cur.pillars || []).forEach((p) => {
          const n = Number(p);
          if (Number.isInteger(n) && !pillars.includes(n)) pillars.push(n);
        });
        cur = cur.parent && nodesById.get(cur.parent) ? nodesById.get(cur.parent) : null;
      }
      map[s.id] = pillars;
    });
    return map;
  }, [shelves, nodesById]);

  const guideForCategory = (category) =>
    categoryGuides[String(category || '').toUpperCase()] || null;

  const recommendedShelfId = useMemo(() => {
    const guide = categoryGuides[String(form.category || '').toUpperCase()];
    const pillar = guide && guide.mapped && guide.pillar != null ? Number(guide.pillar) : null;
    if (!pillar) return '';
    return shelves.find((s) => (pillarByShelfId[s.id] || []).includes(pillar))?.id || '';
  }, [form.category, shelves, pillarByShelfId, categoryGuides]);

  const resolveCallNumber = (key, callNumber, copyShelfId = '') => {
    const value = String(callNumber || '').trim();
    if (!value) {
      setCopyHints((prev) => ({ ...prev, [key]: null }));
      return;
    }
    locationApi
      .resolve({ callNumber: value })
      .then((hint) => {
        setCopyHints((prev) => ({ ...prev, [key]: hint }));
        if (hint && hint.mapped && hint.pillar != null) {
          const pillar = Number(hint.pillar);
          const target = shelves.find((s) => (pillarByShelfId[s.id] || []).includes(pillar))?.id;
          if (target && (!copyShelfId || copyShelfId === autoShelfId.current)) {
            updateCopy(key, 'shelfId', target);
            autoShelfId.current = target;
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (editing) return;
    if (!recommendedShelfId) return;
    const prevAuto = autoShelfId.current;
    const shouldReplace = !selectedShelf || selectedShelf === prevAuto;
    if (shouldReplace) {
      setSelectedShelf(recommendedShelfId);
      autoShelfId.current = recommendedShelfId;
      setCopies((prev) =>
        prev.map((c) =>
          !c.shelfId || c.shelfId === prevAuto ? { ...c, shelfId: recommendedShelfId } : c
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendedShelfId, editing]);

  useEffect(() => {
    libraryApi
      .tree()
      .then((data) => setStructure(Array.isArray(data) ? data : []))
      .catch(() => setStructure([]));
  }, []);

  useEffect(() => {
    let mounted = true;
    locationApi
      .categories()
      .then((list) => {
        if (!mounted || !Array.isArray(list)) return;
        const guides = {};
        list.forEach((g) => { guides[String(g.category || '').toUpperCase()] = g; });
        setCategoryGuides(guides);
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!editing) return;
    let mounted = true;
    setLoadingExisting(true);
    getBook(id).then((record) => {
      if (!mounted) return;
      if (record) {
        setForm({
          title: record.title || '',
          subtitle: record.subtitle || '',
          edition: record.edition || '',
          authors: (record.authors || []).join(', ') || record.author || '',
          isbn: record.isbn || '',
          publisher: record.publisher || '',
          placeOfPublication: record.placeOfPublication || '',
          year: record.year || new Date().getFullYear(),
          category: record.category || '',
          department: record.department || '',
          format: record.format || '',
          physicalDescription: record.physicalDescription || '',
          description: record.description || '',
          notes: Array.isArray(record.notes) ? record.notes.join(', ') : record.notes || '',
          subjects: Array.isArray(record.subjects) ? record.subjects.join(', ') : '',
        });
        setCataloguing({
          cataloguedBy: record.cataloguing?.cataloguedBy || cataloguerName,
          cataloguedDate: record.cataloguing?.cataloguedDate || today(),
          checkedBy: record.cataloguing?.checkedBy || '',
          checkedDate: record.cataloguing?.checkedDate || '',
          originalCataloguing: Boolean(record.cataloguing?.originalCataloguing),
          cip: record.cataloguing?.cip || '',
        });
        if (record.coverImage) {
          setCoverImage(record.coverImage);
          setCoverPreview(record.coverImage);
        }
        const bookLoc = record.location || {};
        const bookShelfKey = locationStringOf(bookLoc)?.replaceAll(' → ', '|') || '';
        const matchedBookShelf = shelfOptions.find((o) => o.key === bookShelfKey);
        setSelectedShelf(matchedBookShelf ? matchedBookShelf.value : '');

        const nextCopies = (record.copies || []).map((c) => {
          const key = copyKey(c);
          const match = shelfOptions.find((o) => o.key === key);
          return {
            _key: `${c.id || c.code || 'copy'}-${Math.random().toString(36).slice(2, 7)}`,
            code: c.code || c.id || '',
            accessionNumber: c.accessionNumber || '',
            callNumber: c.callNumber || '',
            copyNumber: c.copyNumber || '',
            status: c.status || 'available',
            rfidTag: c.rfidTag || '',
            shelfId: match ? match.value : (matchedBookShelf ? matchedBookShelf.value : ''),
          };
        });
        setCopies(nextCopies);
      }
      setLoadingExisting(false);
    });
    return () => {
      mounted = false;
    };
    // getBook identity changes on every catalog refresh; excluding it avoids re-loading the record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, id, shelfOptions, cataloguerName]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (event) => setCoverPreview(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = (e) => {
    e.stopPropagation();
    setCoverFile(null);
    setCoverImage(null);
    setCoverPreview(null);
    const input = document.getElementById('cover-input');
    if (input) input.value = '';
    toast('Cover removed', 'success');
  };

  const loadExample = () => {
    setForm({ ...WORKSHEET_SAMPLE.form });
    setCataloguing({ ...WORKSHEET_SAMPLE.cataloguing, cataloguedBy: cataloguerName });
    setCopies([{ _key: `copy-${Date.now()}`, ...WORKSHEET_SAMPLE.copy, shelfId: '' }]);
    setSelectedShelf('');
    toast('Cataloguing worksheet example loaded', 'success');
  };

  const clearForm = () => {
    setForm(blankForm());
    setCataloguing(blankCataloguing(cataloguerName));
    setCopies([]);
    setSelectedShelf('');
    toast('Form cleared', 'success');
  };

  const addCopyRow = () => {
    setCopies((prev) => [
      ...prev,
      {
        _key: `copy-${Date.now()}`,
        code: `CP-${Date.now().toString().slice(-5)}`,
        accessionNumber: '',
        callNumber: '',
        copyNumber: '',
        status: 'available',
        rfidTag: '',
        shelfId: selectedShelf,
      },
    ]);
  };

  const updateCopy = (_key, field, value) => {
    setCopies((prev) => prev.map((c) => (c._key === _key ? { ...c, [field]: value } : c)));
  };

  const removeCopy = (_key) => {
    setCopies((prev) => prev.filter((c) => c._key !== _key));
  };

  const buildPayload = () => {
    const shelfLoc = selectedShelf ? shelfToLocation(selectedShelf, nodesById) : { library: 'Main Library' };
    const copyRows = copies.length
      ? copies.map((c) => {
          const loc = c.shelfId ? shelfToLocation(c.shelfId, nodesById) : shelfLoc;
          return {
            code: c.code.trim() || undefined,
            accessionNumber: c.accessionNumber.trim() || null,
            callNumber: c.callNumber.trim() || null,
            copyNumber: c.copyNumber.trim() || null,
            status: c.status,
            rfidTag: c.rfidTag.trim() || null,
            location: loc,
          };
        })
      : [{ code: undefined, status: 'available', location: shelfLoc }];

    return {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      edition: form.edition.trim() || null,
      authors: form.authors.split(',').map((a) => a.trim()).filter(Boolean),
      isbn: form.isbn.trim() || null,
      publisher: form.publisher.trim() || null,
      placeOfPublication: form.placeOfPublication.trim() || null,
      year: form.year ? Number(form.year) : null,
      category: form.category || 'General',
      department: form.department.trim() || null,
      description: form.description.trim() || null,
      subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean),
      keywords: [],
      physicalDescription: form.physicalDescription.trim() || null,
      notes: form.notes.split(',').map((n) => n.trim()).filter(Boolean),
      format: form.format || null,
      coverImage,
      cataloguing: {
        cataloguedBy: cataloguing.cataloguedBy.trim() || null,
        cataloguedDate: cataloguing.cataloguedDate || null,
        checkedBy: cataloguing.checkedBy.trim() || null,
        checkedDate: cataloguing.checkedDate || null,
        originalCataloguing: Boolean(cataloguing.originalCataloguing),
        cip: cataloguing.cip.trim() || null,
        tracings: [],
        crossReferences: [],
      },
      location: shelfLoc,
      copies: copyRows,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('Please enter a book title', 'error');
      return;
    }
    if (!form.category) {
      toast('Please select a category', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      let record;
      if (editing) {
        record = await updateBook(id, payload);
        audit('Update', 'Book', `Updated "${payload.title}"`);
        toast(`"${payload.title}" updated`, 'success');
      } else {
        record = await addBook(payload);
        audit('Add', 'Book', `Added "${record?.title || payload.title}" to the catalogue`);
        toast(`"${record?.title || payload.title}" added to the catalogue`, 'success');
      }
      if (coverFile && record && record.id) {
        try {
          await booksApi.uploadCover(record.id, coverFile);
        } catch {
          toast('Book saved, but cover upload failed.', 'warning');
        }
      }
      navigate(`${basePath}/books`);
    } catch (err) {
      toast(err.message || 'Failed to save the book', 'error');
      setSaving(false);
    }
  };

  const selectedShelfLabel = shelfOptions.find((o) => o.value === selectedShelf)?.label || '';

  if (loadingExisting) {
    return (
      <div className="librarian-page" style={{ textAlign: 'center', padding: '4rem' }}>
        <BookOpen size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading book...</p>
      </div>
    );
  }

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
        <h1>{editing ? 'Edit Book Record' : 'Add New Book'}</h1>
        <p>
          {editing
            ? 'Update the bibliographic, inventory and cataloguing details of this record.'
            : 'Enter the bibliographic, inventory and cataloguing details below (cataloguing worksheet format).'}
        </p>
      </div>

      {!editing && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '0.9rem 1.1rem',
            marginBottom: '1.5rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--primary)',
            borderRadius: '10px',
          }}
        >
          <p style={{ flex: 1, minWidth: '280px', margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Pre-filled with the example record from the cataloguing worksheet (format.md): “Fundamentals of Food
            Process Engineering” by Toledo, Romeo T. Edit the fields, or start with a blank form.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" type="button" onClick={loadExample}>
              Reload Worksheet Example
            </Button>
            <Button variant="outline" type="button" onClick={clearForm}>
              Start Blank
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="content-card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <BookOpen size={18} style={{ color: 'var(--primary)' }} />
            Bibliographic Information
          </h2>

          <div className="form-grid">
            <div className="form-group">
              <label>Book Title *</label>
              <Input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter book title"
                icon={BookOpen}
                required
              />
            </div>
            <div className="form-group">
              <label>Subtitle</label>
              <Input
                name="subtitle"
                value={form.subtitle}
                onChange={handleChange}
                placeholder="Subtitle (optional)"
              />
            </div>
            <div className="form-group">
              <label>Edition</label>
              <Input
                name="edition"
                value={form.edition}
                onChange={handleChange}
                placeholder="e.g. 2nd edition"
                icon={Layers}
              />
            </div>
            <div className="form-group">
              <label>Author(s)</label>
              <Input
                name="authors"
                value={form.authors}
                onChange={handleChange}
                placeholder="Surname, First Name (comma-separated)"
                icon={User}
              />
            </div>
            <div className="form-group">
              <label>ISBN</label>
              <Input
                name="isbn"
                value={form.isbn}
                onChange={handleChange}
                placeholder="e.g. 978-81-239-1551-7"
                icon={Hash}
              />
            </div>
            <div className="form-group">
              <label>Publisher</label>
              <Input
                name="publisher"
                value={form.publisher}
                onChange={handleChange}
                placeholder="e.g. CBS Publishers"
                icon={Building2}
              />
            </div>
            <div className="form-group">
              <label>Place of Publication</label>
              <Input
                name="placeOfPublication"
                value={form.placeOfPublication}
                onChange={handleChange}
                placeholder="e.g. New Delhi"
                icon={MapPin}
              />
            </div>
            <div className="form-group">
              <label>Publication Year</label>
              <Input
                name="year"
                type="number"
                value={form.year}
                onChange={handleChange}
                icon={Calendar}
              />
            </div>
            <div className="form-group">
              <label>Category *</label>
              <Select name="category" value={form.category} onChange={handleChange}>
                <option value="">Select category</option>
                {(Array.isArray(fallbackCategories) ? fallbackCategories : []).map((cat) => (
                  <option key={typeof cat === 'string' ? cat : cat.name} value={typeof cat === 'string' ? cat : cat.name}>
                    {typeof cat === 'string' ? cat : cat.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="form-group">
              <label>Department</label>
              <Input
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="e.g. Food Science & Technology"
              />
            </div>
            <div className="form-group">
              <label>Format</label>
              <Select name="format" value={form.format} onChange={handleChange} placeholder="Select format">
                <option value="">Select format</option>
                {FORMATS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        <div className="content-card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <FileText size={18} style={{ color: 'var(--primary)' }} />
            Physical Description, Notes & Subjects
          </h2>

          <div className="form-grid">
            <div className="form-group">
              <label>Physical Description</label>
              <Input
                name="physicalDescription"
                value={form.physicalDescription}
                onChange={handleChange}
                placeholder="e.g. xiii, 566 p.; ill.; 21 cm"
                icon={Tag}
              />
            </div>
            <div className="form-group">
              <label>Subject Areas</label>
              <Input
                name="subjects"
                value={form.subjects}
                onChange={handleChange}
                placeholder="e.g. food engineering, unit operations (comma-separated)"
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter a short description of the book..."
                rows={4}
                style={{
                  padding: '0.875rem',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                }}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Notes</label>
              <Input
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="e.g. Includes appendix and index (comma-separated)"
              />
            </div>
          </div>
        </div>

        <div className="content-card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Library size={18} style={{ color: 'var(--primary)' }} />
            Book Location
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Based on the {form.category || 'category'} selected, the closest matching shelf is suggested automatically.
            You can still pick any shelf manually.
          </p>

          {(guideForCategory(form.category) || {}).mapped ? (
            <div
              style={{
                padding: '0.9rem 1.1rem',
                marginBottom: '1rem',
                background: 'var(--surface)',
                border: '1px solid var(--primary)',
                borderLeft: '4px solid var(--primary)',
                borderRadius: '10px',
                fontSize: '0.92rem',
                color: 'var(--text)',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '0.3rem' }}>
                <Milestone size={15} style={{ verticalAlign: '-2px', marginRight: '0.35rem' }} />
                Pillar Location Guide
              </div>
              <p style={{ margin: 0 }}>{guideForCategory(form.category).text}</p>
              {recommendedShelfId ? (
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Suggested shelf: <strong>{shelfOptions.find((o) => o.value === recommendedShelfId)?.label}</strong>
                </p>
              ) : (
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  No shelf in the library structure is tagged for Pillar {guideForCategory(form.category).pillar} yet.
                  Please select one manually or add it in Library Structure.
                </p>
              )}
            </div>
          ) : (
            guideForCategory(form.category) && (
              <div
                style={{
                  padding: '0.9rem 1.1rem',
                  marginBottom: '1rem',
                  background: 'var(--surface)',
                  border: '1px dashed var(--border)',
                  borderLeft: '4px solid var(--warning)',
                  borderRadius: '10px',
                  fontSize: '0.92rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {guideForCategory(form.category).text}
              </div>
            )
          )}

          <Select
            label="Shelf Location"
            value={selectedShelf}
            onChange={(e) => {
              autoShelfId.current = null;
              setSelectedShelf(e.target.value);
            }}
            placeholder="Select a shelf"
          >
            <option value="">Select a shelf</option>
            {shelves.map((s) => {
              const label = shelfToLocation(s.id, nodesById);
              return (
                <option key={s.id} value={s.id}>
                  {[label.floor, label.section, label.rack, label.shelf].filter(Boolean).join(' → ')}
                </option>
              );
            })}
          </Select>
          {selectedShelf && (
            <p style={{ fontSize: '0.9rem', color: 'var(--primary)', marginTop: '0.75rem', fontWeight: 500 }}>
              {selectedShelfLabel}
            </p>
          )}
        </div>

        <div className="content-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Boxes size={18} style={{ color: 'var(--primary)' }} />
              Copies / Inventory
            </h2>
            <Button variant="outline" type="button" onClick={addCopyRow}>
              <Plus size={18} />
              Add Copy
            </Button>
          </div>

          {copies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', border: '1px dashed var(--border)', borderRadius: '10px' }}>
              <Boxes size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
              <p>No copies yet. Add a copy, or the system will create one automatically.</p>
            </div>
          ) : (
            copies.map((copy, index) => (
              <div key={copy._key} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', background: 'var(--surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <strong style={{ fontSize: '0.9rem' }}>Copy from catalogue &nbsp;
                    <Badge variant="info">{copy.status}</Badge>
                  </strong>
                  <button
                    type="button"
                    className="action-btn danger"
                    title="Remove copy"
                    onClick={() => removeCopy(copy._key)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <div className="form-group">
                    <label>Copy Code</label>
                    <Input
                      value={copy.code}
                      onChange={(e) => updateCopy(copy._key, 'code', e.target.value)}
                      placeholder={index === 0 ? 'e.g. FE-001' : `Copy ${index + 1}`}
                    />
                  </div>
                  <div className="form-group">
                    <label>Accession Number</label>
                    <Input
                      value={copy.accessionNumber}
                      onChange={(e) => updateCopy(copy._key, 'accessionNumber', e.target.value)}
                      placeholder="e.g. ACC-24501"
                    />
                  </div>
                  <div className="form-group">
                    <label>Call Number</label>
                    <Input
                      value={copy.callNumber}
                      onChange={(e) => updateCopy(copy._key, 'callNumber', e.target.value)}
                      onBlur={() => resolveCallNumber(copy._key, copy.callNumber, copy.shelfId)}
                      placeholder="e.g. TP 370 .T65 2000"
                    />
                    {copyHints[copy._key]?.mapped && (
                      <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--primary)' }}>
                        {copyHints[copy._key].text}
                      </p>
                    )}
                    {copyHints[copy._key] && !copyHints[copy._key].mapped && (
                      <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--warning)' }}>
                        {copyHints[copy._key].text}
                      </p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Copy Number</label>
                    <Input
                      value={copy.copyNumber}
                      onChange={(e) => updateCopy(copy._key, 'copyNumber', e.target.value)}
                      placeholder="e.g. 1"
                    />
                  </div>
                  <div className="form-group">
                    <label>RFID Tag</label>
                    <Input
                      value={copy.rfidTag}
                      onChange={(e) => updateCopy(copy._key, 'rfidTag', e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <Select
                      value={copy.status}
                      onChange={(e) => updateCopy(copy._key, 'status', e.target.value)}
                    >
                      {COPY_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Shelf Location</label>
                    <Select
                      value={copy.shelfId}
                      onChange={(e) => {
                        autoShelfId.current = null;
                        updateCopy(copy._key, 'shelfId', e.target.value);
                      }}
                      placeholder="Select shelf"
                    >
                      <option value="">Use book location</option>
                      {shelves.map((s) => {
                        const label = shelfToLocation(s.id, nodesById);
                        return (
                          <option key={s.id} value={s.id}>
                            {[label.floor, label.section, label.rack, label.shelf].filter(Boolean).join(' → ')}
                          </option>
                        );
                      })}
                    </Select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="content-card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Stamp size={18} style={{ color: 'var(--primary)' }} />
            Cataloguing
          </h2>

          <div className="form-grid">
            <div className="form-group">
              <label>Catalogued By</label>
              <Input
                value={cataloguing.cataloguedBy}
                onChange={(e) => setCataloguing((prev) => ({ ...prev, cataloguedBy: e.target.value }))}
                placeholder="Name of cataloguer"
              />
            </div>
            <div className="form-group">
              <label>Cataloguing Date</label>
              <Input
                type="date"
                value={cataloguing.cataloguedDate}
                onChange={(e) => setCataloguing((prev) => ({ ...prev, cataloguedDate: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Checked By</label>
              <Input
                value={cataloguing.checkedBy}
                onChange={(e) => setCataloguing((prev) => ({ ...prev, checkedBy: e.target.value }))}
                placeholder="Name of checker (optional)"
              />
            </div>
            <div className="form-group">
              <label>Checked Date</label>
              <Input
                type="date"
                value={cataloguing.checkedDate}
                onChange={(e) => setCataloguing((prev) => ({ ...prev, checkedDate: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>CIP</label>
              <Input
                value={cataloguing.cip}
                onChange={(e) => setCataloguing((prev) => ({ ...prev, cip: e.target.value }))}
                placeholder="CIP entry (optional)"
              />
            </div>
            <div className="form-group" style={{ justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={cataloguing.originalCataloguing}
                  onChange={(e) => setCataloguing((prev) => ({ ...prev, originalCataloguing: e.target.checked }))}
                  style={{ width: '18px', height: '18px' }}
                />
                Original cataloguing
              </label>
            </div>
          </div>
        </div>

        <div className="content-card">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Upload size={18} style={{ color: 'var(--primary)' }} />
            Book Cover
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            This photo is shown in search results, book details and the step-by-step location guide. It is uploaded to
            the cloud and saved on the book record.
          </p>
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
                  PNG, JPG, or GIF (max. 8MB)
                </p>
              </>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
            {coverFile ? (
              <Badge variant="warning">
                New photo selected - uploads when you save
              </Badge>
            ) : coverImage ? (
              <Badge variant="success">
                Photo uploaded and saved
              </Badge>
            ) : (
              <Badge variant="info">
                No photo yet
              </Badge>
            )}
            {(coverFile || coverImage) && (
              <Button variant="outline" type="button" onClick={handleRemoveCover}>
                <Trash2 size={16} />
                Remove Cover
              </Button>
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

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" type="button" onClick={() => navigate(`${basePath}/books`)}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} loading={saving}>
            <Save size={18} />
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Save Book'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddBook;