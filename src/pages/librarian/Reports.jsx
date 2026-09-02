import { useState } from 'react';
import { BarChart3, LineChart, PieChart, FileText, Calendar, Download } from 'lucide-react';
import { Button, Select } from '../../components/common';
import './Librarian.css';

const reports = [
  { id: 'borrowings', name: 'Borrowings Report', icon: <BarChart3 size={24} />, description: 'Monthly borrowing statistics and trends' },
  { id: 'returns', name: 'Returns Report', icon: <LineChart size={24} />, description: 'Return processing statistics' },
  { id: 'overdue', name: 'Overdue Books', icon: <PieChart size={24} />, description: 'Overdue books and fines summary' },
  { id: 'inventory', name: 'Inventory Report', icon: <FileText size={24} />, description: 'Complete inventory status summary' },
  { id: 'popular', name: 'Popular Books', icon: <BarChart3 size={24} />, description: 'Most borrowed books ranking' },
  { id: 'usage', name: 'Library Usage', icon: <LineChart size={24} />, description: 'Overall library usage statistics' }
];

const mockData = {
  borrowings: [
    { month: 'Jan', count: 245 }, { month: 'Feb', count: 289 }, { month: 'Mar', count: 324 },
    { month: 'Apr', count: 298 }, { month: 'May', count: 356 }, { month: 'Jun', count: 412 },
    { month: 'Jul', count: 389 }, { month: 'Aug', count: 356 }
  ],
  popular: [
    { title: 'Introduction to Algorithms', count: 145 },
    { title: 'Engineering Mathematics', count: 132 },
    { title: 'Database System Concepts', count: 118 },
    { title: 'Organic Chemistry', count: 105 },
    { title: 'Principles of Anatomy', count: 98 }
  ]
};

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('borrowings');
  const [reportData] = useState(mockData);
  const [showFilters, setShowFilters] = useState(false);

  const currentReport = reports.find(r => r.id === selectedReport);

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Reports</h1>
        <p>Generate and view library statistics reports.</p>
      </div>

      <div className="report-type-list">
        {reports.map(report => (
          <div
            key={report.id}
            className={`report-type-card ${selectedReport === report.id ? 'active' : ''}`}
            onClick={() => setSelectedReport(report.id)}
          >
            <div style={{ marginBottom: '0.75rem' }}>{report.icon}</div>
            <h4>{report.name}</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{report.description}</p>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="toolbar-left" style={{ maxWidth: '400px' }}>
          <Select value="2026" onChange={() => {}}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </Select>
          <Select value="all" onChange={() => {}}>
            <option value="all">All Departments</option>
            <option value="cs">Computer Science</option>
            <option value="eng">Engineering</option>
            <option value="med">Medicine</option>
          </Select>
        </div>
        <div className="toolbar-right">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Calendar size={18} />
            Date Range
          </Button>
          <Button variant="outline">
            <Download size={18} />
            Export
          </Button>
        </div>
      </div>

      <div className="content-card">
        <h2>{currentReport?.name}</h2>

        {selectedReport === 'borrowings' && (
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '300px', padding: '1rem', background: 'var(--background)', borderRadius: '8px' }}>
              {reportData.borrowings.map(item => (
                <div key={item.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{item.count}</span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '50px',
                      height: `${(item.count / 450) * 200}px`,
                      background: 'var(--primary)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.3s'
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedReport === 'popular' && (
          <div style={{ padding: '1rem' }}>
            {reportData.popular.map((item, index) => (
              <div key={item.title} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ width: '30px', fontSize: '1.1rem', fontWeight: 600, color: 'var(--primary)' }}>
                  #{index + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ color: 'var(--text)' }}>{item.title}</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>{item.count} borrows</span>
                  </div>
                  <div className="capacity-bar">
                    <div className="capacity-fill low" style={{ width: `${(item.count / 150) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {(selectedReport === 'returns' || selectedReport === 'overdue' || selectedReport === 'inventory' || selectedReport === 'usage') && (
          <div className="report-area">
            <currentReport.icon size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
            <h3>{currentReport.name}</h3>
            <p>
              Chart and detailed data visualization for this report type will be displayed here.
              Select the appropriate date range and filters to generate the report.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
