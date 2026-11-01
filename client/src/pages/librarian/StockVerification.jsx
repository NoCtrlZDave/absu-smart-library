import { useEffect, useState } from 'react';
import { CheckCircle, ClipboardCheck, Plus, ScanLine, XCircle } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Modal, Pagination, Select } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { inventoryApi } from '../../services/inventory';
import { formatDateTime } from '../../utils/dates';
import './Librarian.css';
import '../Circulation.css';

const STATUS_VARIANT = { open: 'warning', in_progress: 'info', completed: 'success', cancelled: 'danger' };

const StockVerification = () => {
  const showToast = useToast();
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', department: '', category: '', location: '', notes: '' });
  const [creating, setCreating] = useState(false);
  const [active, setActive] = useState(null);
  const [scans, setScans] = useState([]);
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    inventoryApi.verifications({ status: status === 'all' ? undefined : status, page, limit: 10 })
      .then((data) => {
        if (!mounted) return;
        setSessions(data?.items || []);
        setPagination(data?.pagination || null);
      })
      .catch((err) => {
        if (mounted) showToast(err.message || 'Could not load verification sessions.', 'error');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [status, page, refreshKey, showToast]);

  const refresh = () => setRefreshKey((value) => value + 1);

  const openSession = async (session) => {
    try {
      const data = await inventoryApi.verification(session.id);
      setActive(data.session);
      setScans(data.scans || []);
      setReport(null);
      setCode('');
      setLocation('');
    } catch (err) {
      showToast(err.message || 'Could not open session.', 'error');
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      showToast('Enter a session name.', 'error');
      return;
    }
    setCreating(true);
    try {
      const session = await inventoryApi.createVerification(form);
      showToast(`Session opened with ${session.expectedCount} expected copies.`, 'success');
      setCreateOpen(false);
      setForm({ name: '', department: '', category: '', location: '', notes: '' });
      refresh();
      openSession(session);
    } catch (err) {
      showToast(err.message || 'Could not start session.', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleScan = async () => {
    if (!code.trim()) return;
    setScanning(true);
    try {
      const result = await inventoryApi.scanVerification(active.id, {
        code: code.trim(),
        detectedLocation: location || undefined,
        method: 'barcode',
      });
      setScans((prev) => [result, ...prev]);
      setCode('');
      showToast(result.result ? `Scan: ${result.result}` : 'Scan recorded.', result.result === 'unregistered' ? 'warning' : 'success');
      const data = await inventoryApi.verification(active.id);
      setActive(data.session);
    } catch (err) {
      showToast(err.message || 'Could not record scan.', 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleComplete = async () => {
    try {
      const session = await inventoryApi.completeVerification(active.id);
      setActive(session);
      showToast('Verification completed.', 'success');
      refresh();
    } catch (err) {
      showToast(err.message || 'Could not complete session.', 'error');
    }
  };

  const loadReport = async () => {
    try {
      const data = await inventoryApi.verificationReport(active.id);
      setReport(data);
    } catch (err) {
      showToast(err.message || 'Could not load report.', 'error');
    }
  };

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Stock Verification</h1>
        <p>Open a session, scan accession/barcode/ISBN values and reconcile missing or misplaced copies.</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left" style={{ maxWidth: 260 }}>
          <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="all">All sessions</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
        <div className="toolbar-right">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={18} /> New session
          </Button>
        </div>
      </div>

      <div className="content-card">
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading sessions...</p>
        ) : sessions.length ? (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Session</th><th>Scope</th><th>Expected</th><th>Scanned</th><th>Missing</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>
                        <span className="cell-title">{session.name}</span>
                        <span className="cell-subtitle">{formatDateTime(session.createdAt)}</span>
                      </td>
                      <td>
                        {session.scope?.department || 'All departments'}
                        <span className="cell-subtitle">{session.scope?.location || 'All locations'}</span>
                      </td>
                      <td>{session.expectedCount}</td>
                      <td>{session.scannedCount}</td>
                      <td>{session.missingCount}</td>
                      <td><Badge variant={STATUS_VARIANT[session.status] || 'info'}>{session.status.replace('_', ' ')}</Badge></td>
                      <td>
                        <Button size="sm" variant="outline" onClick={() => openSession(session)}>
                          Open
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={pagination?.page || 1} totalPages={pagination?.totalPages || 1} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState icon={ClipboardCheck} title="No verification sessions" description="Start a session to reconcile your physical collection." action={<Button onClick={() => setCreateOpen(true)}><Plus size={18} /> New session</Button>} />
        )}
      </div>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Start stock verification">
        <div className="form-stack">
          <Input label="Session name" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
          <Input label="Department (optional)" value={form.department} onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))} />
          <Input label="Category (optional)" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
          <Input label="Location filter (optional)" value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} />
          <Input label="Notes (optional)" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
          <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Start session</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={Boolean(active)} onClose={() => setActive(null)} title={active?.name || 'Verification'} size="lg">
        {active && (
          <div className="form-stack">
            <div className="circulation-summary">
              <div className="summary-tile"><span>Expected</span><strong>{active.expectedCount}</strong></div>
              <div className="summary-tile"><span>Scanned</span><strong>{active.scannedCount}</strong></div>
              <div className="summary-tile"><span>Matched</span><strong>{active.matchedCount}</strong></div>
              <div className="summary-tile"><span>Missing</span><strong>{active.missingCount}</strong></div>
            </div>

            {['open', 'in_progress'].includes(active.status) && (
              <>
                <Input
                  label="Scan barcode / QR / accession number / ISBN"
                  placeholder="Scan or type a code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') handleScan(); }}
                />
                <Input label="Detected location (optional)" value={location} onChange={(event) => setLocation(event.target.value)} />
                <div className="table-actions">
                  <Button onClick={handleScan} loading={scanning}><ScanLine size={16} /> Record scan</Button>
                  <Button variant="outline" onClick={handleComplete}><CheckCircle size={16} /> Complete session</Button>
                </div>
              </>
            )}

            <div className="table-container" style={{ maxHeight: 320, overflowY: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Code</th><th>Book</th><th>Result</th><th>Time</th></tr></thead>
                <tbody>
                  {scans.map((scan) => (
                    <tr key={scan.id}>
                      <td>{scan.copyCode || scan.scannedCode}</td>
                      <td>{scan.bookTitle || '-'}</td>
                      <td>
                        <Badge variant={scan.result === 'matched' ? 'success' : scan.result === 'duplicate' ? 'info' : 'warning'}>
                          {scan.result}
                        </Badge>
                      </td>
                      <td>{formatDateTime(scan.scannedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-actions">
              <Button variant="outline" onClick={loadReport}><XCircle size={16} /> Discrepancy report</Button>
            </div>

            {report && (
              <div className="inline-note">
                <strong>Summary:</strong> {report.summary.matched} matched, {report.summary.missing} missing,
                {' '}{report.summary.unregistered} unregistered, {report.summary.misplaced} misplaced,
                {' '}{report.summary.damaged} damaged, {report.summary.duplicates} duplicate scans.
                {report.missing?.length ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    Missing: {report.missing.map((item) => `${item.bookTitle} (${item.copyCode})`).join(', ')}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StockVerification;
