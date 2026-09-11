import { useState, useEffect } from 'react';
import { Check, X, Search, ShieldCheck, GraduationCap, Briefcase } from 'lucide-react';
import { Button, Input, Spinner, Badge, Modal } from '../../components/common';
import { adminApi } from '../../services/admin';
import { useToast } from '../../components/common/useToast';
import './Admin.css';

const StaffVerification = () => {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    try {
      const data = await adminApi.staffRequests();
      setRequests(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load staff requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = requests.filter((r) => {
    if (search === '') return true;
    const q = search.toLowerCase();
    return (
      `${r.first_name} ${r.last_name}`.toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.staffNumber || '').toLowerCase().includes(q) ||
      (r.department || '').toLowerCase().includes(q)
    );
  });

  const handleVerify = async (req) => {
    setBusyId(req.id);
    try {
      await adminApi.verifyStaff(req.id);
      toast.success?.(`${req.first_name} ${req.last_name} verified`);
      load();
    } catch (err) {
      toast.error?.(err.message || 'Verification failed');
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (req) => {
    setRejectTarget(req);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    try {
      await adminApi.rejectStaff(rejectTarget.id);
      toast.success?.(`${rejectTarget.first_name} ${rejectTarget.last_name} rejected`);
      setRejectTarget(null);
      load();
    } catch (err) {
      toast.error?.(err.message || 'Rejection failed');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Spinner />;
  if (error && requests.length === 0)
    return <div className="admin-page" style={{ color: 'var(--danger)', textAlign: 'center', padding: '3rem' }}>{error}</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Staff Verification</h1>
        <p>Review staff self-registrations and verify their identity to activate their portal.</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <Input
            placeholder="Search by name, email, staff number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={Search}
          />
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="content-card">
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            No pending staff registrations.
          </p>
        </div>
      ) : (
        <div className="content-card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Type</th>
                  <th>Details</th>
                  <th>Identity Confirmation</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar">
                          {req.profileImage ? (
                            <img src={req.profileImage} alt={req.first_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          ) : (
                            <ShieldCheck size={18} />
                          )}
                        </div>
                        <div>
                          <strong>{req.first_name} {req.last_name}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{req.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge className={req.staffType === 'teaching' ? 'badge-info' : 'badge-warning'}>
                        {req.staffType === 'teaching' ? <GraduationCap size={12} /> : <Briefcase size={12} />}
                        {req.staffType === 'teaching' ? 'Teaching' : 'Non-teaching'}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {req.title && <div>{req.title}</div>}
                      {req.staffNumber && <div><strong>{req.staffNumber}</strong></div>}
                      {req.department && <div>{req.department}</div>}
                      {req.faculty && <div>{req.faculty}</div>}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                      {req.identityInfo || '-'}
                    </td>
                    <td>
                      <Badge className="badge-warning">Pending</Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <Button
                          size="sm"
                          className="btn-success"
                          disabled={busyId === req.id}
                          onClick={() => handleVerify(req)}
                        >
                          <Check size={14} />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          className="btn-danger"
                          disabled={busyId === req.id}
                          onClick={() => openReject(req)}
                        >
                          <X size={14} />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                No staff match your search.
              </p>
            )}
          </div>
        </div>
      )}

      <Modal open={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} title="Reject staff registration">
        <div className="form-row">
          <label className="input-label">Reason (optional)</label>
          <textarea
            className="textarea-field"
            placeholder="Why is this registration being rejected?"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Button className="btn-outline" onClick={() => setRejectTarget(null)}>
            Cancel
          </Button>
          <Button className="btn-danger" disabled={busyId === rejectTarget?.id} onClick={confirmReject}>
            Reject Registration
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default StaffVerification;