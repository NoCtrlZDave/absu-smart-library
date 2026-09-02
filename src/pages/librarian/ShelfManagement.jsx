import { useState } from 'react';
import { Layers, Grid3X3, ChevronRight, BookOpen, ChevronDown } from 'lucide-react';
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

const ShelfManagement = () => {
  const [structure] = useState(initialStructure);
  const [expandedFloors, setExpandedFloors] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedRacks, setExpandedRacks] = useState({});

  const toggleFloor = (floorName) => {
    setExpandedFloors(prev => ({ ...prev, [floorName]: !prev[floorName] }));
  };

  const toggleSection = (floorName, sectionName) => {
    const key = `${floorName}-${sectionName}`;
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleRack = (floorName, sectionName, rackName) => {
    const key = `${floorName}-${sectionName}-${rackName}`;
    setExpandedRacks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getCapacityClass = (percentage) => {
    if (percentage >= 85) return 'high';
    if (percentage >= 70) return 'medium';
    return 'low';
  };

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Shelf Management</h1>
        <p>Manage library structure: floors, sections, racks, and shelves.</p>
      </div>

      <div className="content-card">
        <div className="shelf-tree">
          {structure.library.map(floor => (
            <div key={floor.name} className="shelf-node">
              <div className="shelf-node-header" onClick={() => toggleFloor(floor.name)}>
                <h3>
                  <Layers size={20} style={{ color: 'var(--primary)' }} />
                  {floor.name}
                </h3>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {expandedFloors[floor.name] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </span>
              </div>

              {expandedFloors[floor.name] && (
                <div className="shelf-children">
                  {floor.sections.map(section => (
                    <div key={section.name} className="shelf-child">
                      <h4 onClick={() => toggleSection(floor.name, section.name)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Grid3X3 size={16} />
                        {section.name}
                      </h4>
                      {expandedSections[`${floor.name}-${section.name}`] && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {section.racks.map(rack => (
                            <div key={rack.name} style={{ padding: '0.5rem', background: 'var(--background)', borderRadius: '6px' }}>
                              <h5 onClick={() => toggleRack(floor.name, section.name, rack.name)} style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <ChevronRight size={14} />
                                {rack.name}
                              </h5>
                              {expandedRacks[`${floor.name}-${section.name}-${rack.name}`] && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {rack.shelves.map(shelf => (
                                    <div key={shelf.name}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                          <BookOpen size={12} style={{ marginRight: '4px' }} />
                                          {shelf.name}
                                        </span>
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
    </div>
  );
};

export default ShelfManagement;
