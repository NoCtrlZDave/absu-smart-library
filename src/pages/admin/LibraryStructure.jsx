import { useState } from 'react';
import { Building2, Layers, Grid3X3, Rows3, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button, Modal } from '../../components/common';
import './Admin.css';

const LibraryStructure = () => {
  const [floors, setFloors] = useState([
    { id: 1, name: 'Floor 1', sections: 3, description: 'General Studies & Reserves' },
    { id: 2, name: 'Floor 2', sections: 4, description: 'Engineering & Sciences' },
    { id: 3, name: 'Floor 3', sections: 4, description: 'Computer Science & IT' },
    { id: 4, name: 'Floor 4', sections: 3, description: 'Law & Business' },
    { id: 5, name: 'Floor 5', sections: 2, description: 'Journals & Archives' }
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newFloor, setNewFloor] = useState({ name: '', description: '' });
  const [selectedFloor, setSelectedFloor] = useState(null);

  const handleAddFloor = (e) => {
    e.preventDefault();
    setFloors(prev => [...prev, { id: prev.length + 1, sections: 1, ...newFloor }]);
    setShowAddModal(false);
    setNewFloor({ name: '', description: '' });
  };

  const handleDelete = (floor) => {
    setSelectedFloor(floor);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setFloors(prev => prev.filter(f => f.id !== selectedFloor.id));
    setShowDeleteModal(false);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Library Structure</h1>
        <p>Manage floors, sections, racks, and shelves.</p>
      </div>

      <div className="structure-section">
        <h3>
          <Layers size={20} style={{ color: 'var(--primary)' }} />
          Floors
          <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)} style={{ marginLeft: 'auto' }}>
            <Plus size={16} />
            Add Floor
          </Button>
        </h3>

        <div className="structure-list">
          {floors.map(floor => (
            <div key={floor.id} className="structure-item">
              <div className="structure-item-info">
                <h4>{floor.name}</h4>
                <p>{floor.description}</p>
                <p style={{ color: 'var(--primary)' }}>
                  <Building2 size={12} style={{ marginRight: '4px' }} />
                  {floor.sections} sections
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="action-btn" title="Edit">
                  <Pencil size={16} />
                </button>
                <button className="action-btn danger" onClick={() => handleDelete(floor)} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="structure-section">
        <h3>
          <Grid3X3 size={20} style={{ color: 'var(--primary)' }} />
          Sections (Floor 3 - Computer Science)
        </h3>
        <div className="structure-list">
          <div className="structure-item">
            <div className="structure-item-info">
              <h4>Section A</h4>
              <p>Programming & Algorithms</p>
            </div>
            <Button size="sm" variant="outline"><Plus size={16} /> Add</Button>
          </div>
          <div className="structure-item">
            <div className="structure-item-info">
              <h4>Section B</h4>
              <p>Databases & Systems</p>
            </div>
            <Button size="sm" variant="outline"><Plus size={16} /> Add</Button>
          </div>
          <div className="structure-item">
            <div className="structure-item-info">
              <h4>Section C</h4>
              <p>Networks & Security</p>
            </div>
            <Button size="sm" variant="outline"><Plus size={16} /> Add</Button>
          </div>
        </div>
      </div>

      <div className="structure-section">
        <h3>
          <Rows3 size={20} style={{ color: 'var(--primary)' }} />
          Racks & Shelves (Floor 3, Section A)
        </h3>
        <div className="structure-list">
          <div className="structure-item">
            <div className="structure-item-info">
              <h4>Rack 1</h4>
              <p>8 shelves | 75% capacity</p>
            </div>
            <Button size="sm" variant="outline"><Plus size={16} /> Add</Button>
          </div>
          <div className="structure-item">
            <div className="structure-item-info">
              <h4>Rack 2</h4>
              <p>8 shelves | 60% capacity</p>
            </div>
            <Button size="sm" variant="outline"><Plus size={16} /> Add</Button>
          </div>
          <div className="structure-item">
            <div className="structure-item-info">
              <h4>Rack 3</h4>
              <p>8 shelves | 90% capacity</p>
            </div>
            <Button size="sm" variant="outline"><Plus size={16} /> Add</Button>
          </div>
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Floor">
        <form onSubmit={handleAddFloor}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>Floor Name</label>
              <input
                type="text"
                placeholder="e.g. Floor 6"
                value={newFloor.name}
                onChange={(e) => setNewFloor({ ...newFloor, name: e.target.value })}
                style={{
                  padding: '0.875rem',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: 'var(--surface)',
                  color: 'var(--text)'
                }}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                placeholder="e.g. New Wing"
                value={newFloor.description}
                onChange={(e) => setNewFloor({ ...newFloor, description: e.target.value })}
                style={{
                  padding: '0.875rem',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  background: 'var(--surface)',
                  color: 'var(--text)'
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit">
              <Plus size={18} />
              Add Floor
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Floor">
        <p>Are you sure you want to delete {selectedFloor?.name}? This will also remove all sections, racks, and shelves under it.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>
            <Trash2 size={18} />
            Delete Floor
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default LibraryStructure;
