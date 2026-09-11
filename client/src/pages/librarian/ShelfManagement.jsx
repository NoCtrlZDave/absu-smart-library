import { useState } from 'react';
import {
  Layers,
  Grid3X3,
  ChevronRight,
  BookOpen,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button, Input, Modal } from '../../components/common';
import { useAudit } from '../../context/useAudit';
import { useToast } from '../../components/common/useToast';
import './Librarian.css';

const initialStructure = {
  library: [
    {
      name: 'Floor 1',
      sections: [
        { name: 'Section A', racks: [{ name: 'Rack 1', shelves: [{ name: 'Shelf 1', capacity: 90 }, { name: 'Shelf 2', capacity: 75 }, { name: 'Shelf 3', capacity: 60 }] }, { name: 'Rack 2', shelves: [{ name: 'Shelf 1', capacity: 80 }, { name: 'Shelf 2', capacity: 65 }] }] },
        { name: 'Section B', racks: [{ name: 'Rack 1', shelves: [{ name: 'Shelf 1', capacity: 70 }, { name: 'Shelf 2', capacity: 85 }] }] }
      ]
    },
    {
      name: 'Floor 2',
      sections: [
        { name: 'Section A', racks: [{ name: 'Rack 1', shelves: [{ name: 'Shelf 1', capacity: 65 }, { name: 'Shelf 2', capacity: 90 }] }] }
      ]
    }
  ]
};

const uid = () => `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const enrich = (node) => {
  const next = { ...node, id: node.id || uid() };
  if (next.sections) next.sections = next.sections.map(enrich);
  if (next.racks) next.racks = next.racks.map(enrich);
  if (next.shelves) next.shelves = next.shelves.map(enrich);
  return next;
};

const KIND_LABEL = { floor: 'Floor', section: 'Section', rack: 'Rack', shelf: 'Shelf' };

const locateSiblings = (nodes, id) => {
  if (nodes.some((n) => n.id === id)) return nodes;
  for (const node of nodes) {
    if (node.sections) {
      const found = locateSiblings(node.sections, id);
      if (found) return found;
    }
    if (node.racks) {
      const found = locateSiblings(node.racks, id);
      if (found) return found;
    }
    if (node.shelves) {
      const found = locateSiblings(node.shelves, id);
      if (found) return found;
    }
  }
  return null;
};

const mapAdd = (nodes, parentId, child) =>
  nodes.map((n) => {
    if (n.id === parentId) {
      if (n.sections) return { ...n, sections: [...n.sections, child] };
      if (n.racks) return { ...n, racks: [...n.racks, child] };
      if (n.shelves) return { ...n, shelves: [...n.shelves, child] };
      return n;
    }
    if (n.sections) return { ...n, sections: mapAdd(n.sections, parentId, child) };
    if (n.racks) return { ...n, racks: mapAdd(n.racks, parentId, child) };
    if (n.shelves) return { ...n, shelves: mapAdd(n.shelves, parentId, child) };
    return n;
  });

const mapUpdate = (nodes, id, patch) =>
  nodes.map((n) => {
    if (n.id === id) return { ...n, ...patch };
    if (n.sections) return { ...n, sections: mapUpdate(n.sections, id, patch) };
    if (n.racks) return { ...n, racks: mapUpdate(n.racks, id, patch) };
    if (n.shelves) return { ...n, shelves: mapUpdate(n.shelves, id, patch) };
    return n;
  });

const mapRemove = (nodes, id) =>
  nodes
    .filter((n) => n.id !== id)
    .map((n) => {
      if (n.sections) return { ...n, sections: mapRemove(n.sections, id) };
      if (n.racks) return { ...n, racks: mapRemove(n.racks, id) };
      if (n.shelves) return { ...n, shelves: mapRemove(n.shelves, id) };
      return n;
    });

const ShelfManagement = () => {
  const [structure, setStructure] = useState(() => ({
    library: initialStructure.library.map(enrich),
  }));
  const { audit } = useAudit();
  const showToast = useToast();

  const [expandedFloors, setExpandedFloors] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedRacks, setExpandedRacks] = useState({});

  const [form, setForm] = useState({ open: false });
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(50);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const toggleFloor = (floorName) => {
    setExpandedFloors((prev) => ({ ...prev, [floorName]: !prev[floorName] }));
  };

  const toggleSection = (floorName, sectionName) => {
    const key = `${floorName}-${sectionName}`;
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRack = (floorName, sectionName, rackName) => {
    const key = `${floorName}-${sectionName}-${rackName}`;
    setExpandedRacks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getCapacityClass = (percentage) => {
    if (percentage >= 85) return 'high';
    if (percentage >= 70) return 'medium';
    return 'low';
  };

  const openForm = (kind, mode, { parentId = null, parentPath = [], item = null }) => {
    setForm({ open: true, kind, mode, parentId, parentPath });
    setName(item?.name || '');
    setCapacity(item?.capacity ?? 50);
    setFormError('');
  };

  const closeForm = () => {
    setForm({ open: false });
    setFormError('');
  };

  const expandTo = (path, newNodeName, kind) => {
    if (path.length >= 1) setExpandedFloors((p) => ({ ...p, [path[0]]: true }));
    if (path.length >= 2) setExpandedSections((p) => ({ ...p, [`${path[0]}-${path[1]}`]: true }));
    if (path.length >= 3) setExpandedRacks((p) => ({ ...p, [`${path[0]}-${path[1]}-${path[2]}`]: true }));

    if (kind === 'floor') setExpandedFloors((p) => ({ ...p, [newNodeName]: true }));
    if (kind === 'section') setExpandedSections((p) => ({ ...p, [`${path[0]}-${newNodeName}`]: true }));
    if (kind === 'rack') setExpandedRacks((p) => ({ ...p, [`${path[0]}-${path[1]}-${newNodeName}`]: true }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setFormError('A name is required.');
      return;
    }
    const cap = Number(capacity);
    if (form.kind === 'shelf' && (!Number.isInteger(cap) || cap < 0 || cap > 100)) {
      setFormError('Capacity must be a whole number between 0 and 100.');
      return;
    }

    const siblings =
      form.kind === 'floor' ? structure.library : locateSiblings(structure.library, form.parentId);
    const clash = siblings?.some((s) => s.name === cleanName && s.id !== form.item?.id);
    if (clash) {
      setFormError(`A ${KIND_LABEL[form.kind].toLowerCase()} with that name already exists here.`);
      return;
    }

    const location = form.parentPath.length ? form.parentPath.join(' \u203A ') : '';

    if (form.mode === 'edit') {
      const patch =
        form.kind === 'shelf' ? { name: cleanName, capacity: cap } : { name: cleanName };
      setStructure((prev) => ({ ...prev, library: mapUpdate(prev.library, form.item.id, patch) }));
      audit('Update', 'Shelf', `Edited ${KIND_LABEL[form.kind]} "${cleanName}"${location ? ` in ${location}` : ''}`);
      showToast(`${KIND_LABEL[form.kind]} "${cleanName}" updated.`);
    } else {
      const child =
        form.kind === 'floor'
          ? { id: uid(), name: cleanName, sections: [] }
          : form.kind === 'section'
            ? { id: uid(), name: cleanName, racks: [] }
            : form.kind === 'rack'
              ? { id: uid(), name: cleanName, shelves: [] }
              : { id: uid(), name: cleanName, capacity: cap };

      setStructure((prev) => ({
        ...prev,
        library: form.parentId ? mapAdd(prev.library, form.parentId, child) : [...prev.library, child],
      }));
      expandTo(form.parentPath, cleanName, form.kind);
      audit('Add', 'Shelf', `Added ${KIND_LABEL[form.kind]} "${cleanName}"${location ? ` to ${location}` : ''}`);
      showToast(`${KIND_LABEL[form.kind]} "${cleanName}" added.`);
    }

    closeForm();
  };

  const handleConfirmDelete = () => {
    const { kind, item, parentPath } = deleteTarget;
    setStructure((prev) => ({ ...prev, library: mapRemove(prev.library, item.id) }));
    const location = parentPath.length ? parentPath.join(' \u203A ') : '';
    audit('Delete', 'Shelf', `Removed ${KIND_LABEL[kind]} "${item.name}"${location ? ` from ${location}` : ''}`);
    showToast(`${KIND_LABEL[kind]} "${item.name}" removed.`);
    setDeleteTarget(null);
  };

  const nodeActions = (kind, node, { parentId = null, parentPath = [] }) => (
    <div className="shelf-actions" onClick={(e) => e.stopPropagation()}>
      {kind !== 'shelf' && (
        <button
          type="button"
          className="action-btn"
          title={`Add ${KIND_LABEL[kind === 'floor' ? 'section' : kind === 'section' ? 'rack' : 'shelf'].toLowerCase()}`}
          onClick={(e) => {
            e.stopPropagation();
            const nextKind = kind === 'floor' ? 'section' : kind === 'section' ? 'rack' : 'shelf';
            openForm(nextKind, 'add', { parentId: node.id, parentPath: [...parentPath, node.name] });
          }}
        >
          <Plus size={14} />
        </button>
      )}
      <button
        type="button"
        className="action-btn"
        title={`Edit ${KIND_LABEL[kind].toLowerCase()}`}
        onClick={(e) => {
          e.stopPropagation();
          openForm(kind, 'edit', { parentId, parentPath, item: node });
        }}
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        className="action-btn danger"
        title={`Delete ${KIND_LABEL[kind].toLowerCase()}`}
        onClick={(e) => {
          e.stopPropagation();
          setDeleteTarget({ kind, item: node, parentPath });
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Shelf Management</h1>
        <p>Manage and edit the library structure: floors, sections, racks, and shelves.</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
            Click a node to expand it. Use the buttons to add, edit, or remove structure details.
          </p>
        </div>
        <div className="toolbar-right">
          <Button onClick={() => openForm('floor', 'add', {})}>
            <Plus size={18} />
            Add Floor
          </Button>
        </div>
      </div>

      <div className="content-card">
        <div className="shelf-tree">
          {structure.library.map((floor) => (
            <div key={floor.id} className="shelf-node">
              <div className="shelf-node-header" onClick={() => toggleFloor(floor.name)}>
                <h3>
                  <Layers size={20} style={{ color: 'var(--primary)' }} />
                  {floor.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {nodeActions('floor', floor, { parentPath: [] })}
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {expandedFloors[floor.name] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </span>
                </div>
              </div>

              {expandedFloors[floor.name] && (
                <div className="shelf-children">
                  {floor.sections.map((section) => (
                    <div key={section.id} className="shelf-child">
                      <h4>
                        <Grid3X3 size={16} />
                        <span onClick={() => toggleSection(floor.name, section.name)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {section.name}
                        </span>
                        {nodeActions('section', section, {
                          parentId: floor.id,
                          parentPath: [floor.name],
                        })}
                      </h4>
                      {expandedSections[`${floor.name}-${section.name}`] && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {section.racks.map((rack) => (
                            <div key={rack.id} style={{ padding: '0.5rem', background: 'var(--background)', borderRadius: '6px' }}>
                              <h5
                                onClick={() => toggleRack(floor.name, section.name, rack.name)}
                                style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
                              >
                                <ChevronRight size={14} />
                                {rack.name}
                                {nodeActions('rack', rack, {
                                  parentId: section.id,
                                  parentPath: [floor.name, section.name],
                                })}
                              </h5>
                              {expandedRacks[`${floor.name}-${section.name}-${rack.name}`] && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {rack.shelves.map((shelf) => (
                                    <div key={shelf.id}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            <BookOpen size={12} style={{ marginRight: '4px' }} />
                                            {shelf.name}
                                          </span>
                                          {nodeActions('shelf', shelf, {
                                            parentId: rack.id,
                                            parentPath: [floor.name, section.name, rack.name],
                                          })}
                                        </div>
                                        <span className="capacity-label">{shelf.capacity}%</span>
                                      </div>
                                      <div className="capacity-bar">
                                        <div
                                          className={`capacity-fill ${getCapacityClass(shelf.capacity)}`}
                                          style={{ width: `${shelf.capacity}%` }}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={form.open}
        onClose={closeForm}
        title={`${form.mode === 'edit' ? 'Edit' : 'Add'} ${form.kind ? KIND_LABEL[form.kind] : ''}`}
      >
        <form onSubmit={handleFormSubmit} noValidate>
          <Input
            label={`${form.kind ? KIND_LABEL[form.kind] : ''} Name`}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setFormError('');
            }}
            placeholder={form.kind === 'floor' ? 'e.g. Floor 3' : form.kind === 'section' ? 'e.g. Section C' : form.kind === 'rack' ? 'e.g. Rack 3' : 'e.g. Shelf 4'}
            autoFocus
            required
          />
          {form.kind === 'shelf' && (
            <Input
              label="Capacity (%)"
              type="number"
              min={0}
              max={100}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              helper="How full the shelf currently is, out of 100."
              required
            />
          )}
          {formError && (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{formError}</p>
          )}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
            <Button variant="outline" type="button" onClick={closeForm}>Cancel</Button>
            <Button type="submit">{form.mode === 'edit' ? 'Save Changes' : 'Add'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title={`Delete ${deleteTarget ? KIND_LABEL[deleteTarget.kind] : ''}`}>
        <p>
          Remove <strong>{deleteTarget?.item?.name}</strong>
          {deleteTarget?.parentPath?.length ? ` from ${deleteTarget.parentPath.join(' \u203A ')}` : ''}?
          {deleteTarget?.kind !== 'shelf' && ' Everything inside it will be removed as well.'}
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            <Trash2 size={18} />
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ShelfManagement;