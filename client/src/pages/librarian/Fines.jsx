import { useEffect, useState } from 'react';
import { CircleDollarSign, Search, Receipt, Wallet } from 'lucide-react';
import { Badge, Button, EmptyState, Input, Modal, Pagination, Select } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { finesApi } from '../../services/fines';
import { formatDate, formatDateTime } from '../../utils/dates';
import './Librarian.css';
import '../Circulation.css';

const money = (value) => `NGN ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TABS = [
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'overdue', label: 'Overdue loans' },
  { key: 'payments', label: 'Payments' },
];

const Fines = () => {
  const showToast = useToast();
  const [tab, setTab] = useState('outstanding');
  const [rows, setRows] = useState([]);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [target, setTarget] = useState(null);
  const [action, setAction] = useState('pay');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const params = { page, limit: 10, search: search || undefined };

    const request = tab === 'payments'
      ? finesApi.payments(params)
      : finesApi.list({ ...params, status: tab });

    Promise.all([request, finesApi.summary()])
      .then(([data, stats]) => {
        if (!mounted) return;
        if (tab === 'payments') setPayments(data?.items || []);
        else setRows(data?.items || []);
        setPagination(data?.pagination || null);
        setSummary(stats || null);
      })
      .catch((err) => {
        if (mounted) showToast(err.message || 'Could not load fines.', 'error');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [tab, page, search, refreshKey, showToast]);

  const refresh = () => setRefreshKey((value) => value + 1);

  const openAction = (row, mode) => {
    setTarget(row);
    setAction(mode);
    setAmount(String(row.outstanding || ''));
    setMethod('cash');
    setReference('');
    setReason('');
  };

  const submit = async () => {
    if (!target) return;
    setBusy(true);
    try {
      if (action === 'pay') {
        await finesApi.pay(target.borrowingId, { amount: Number(amount), method, reference: reference || undefined });
        showToast('Payment recorded.', 'success');
      } else {
        await finesApi.waive(target.borrowingId, { amount: Number(amount), reason });
        showToast('Fine waived.', 'success');
      }
      setTarget(null);
      refresh();
    } catch (err) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="librarian-page">
      <div className="page-header">
        <h1>Fines</h1>
        <p>Track overdue charges, record payments and waivers. Rates come from system policy settings.</p>
      </div>

      <div className="circulation-summary">
        <div className="summary-tile">
          <span>Outstanding</span>
          <strong style={{ color: summary?.outstandingTotal ? 'var(--danger)' : undefined }}>
            {money(summary?.outstandingTotal)}
          </strong>
        </div>
        <div className="summary-tile">
          <span>Overdue loans</span>
          <strong>{summary?.overdueLoans || 0}</strong>
        </div>
        <div className="summary-tile">
          <span>Collected</span>
          <strong>{money(summary?.collectedTotal)}</strong>
        </div>
        <div className="summary-tile">
          <span>Payments</span>
          <strong>{summary?.paymentCount || 0}</strong>
        </div>
      </div>

      <div className="page-tabs" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`page-tab${tab === item.key ? ' page-tab--active' : ''}`}
            onClick={() => { setTab(item.key); setPage(1); }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="toolbar-left toolbar-search">
          <Input
            icon={Search}
            placeholder="Search student, matric number or book..."
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="content-card">
        {loading ? (
          <p style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Loading fines...</p>
        ) : tab === 'payments' ? (
          payments.length ? (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr><th>Reference</th><th>Student</th><th>Amount</th><th>Method</th><th>Received by</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.reference}</td>
                        <td>
                          <span className="cell-title">{payment.userName}</span>
                          <span className="cell-subtitle">{payment.identifier}</span>
                        </td>
                        <td>{money(payment.amount)}</td>
                        <td>{payment.method}</td>
                        <td>{payment.receivedByName || '-'}</td>
                        <td>{formatDateTime(payment.paidAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={pagination?.page || 1} totalPages={pagination?.totalPages || 1} onPageChange={setPage} />
            </>
          ) : (
            <EmptyState icon={Receipt} title="No payments recorded" description="Recorded fine payments will appear here." />
          )
        ) : rows.length ? (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr><th>Student</th><th>Book</th><th>Due date</th><th>Overdue</th><th>Outstanding</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.borrowingId}>
                      <td>
                        <span className="cell-title">{row.studentName}</span>
                        <span className="cell-subtitle">{row.matricNumber}</span>
                      </td>
                      <td>
                        <span className="cell-title">{row.bookTitle}</span>
                        <span className="cell-subtitle">Copy {row.copyCode}</span>
                      </td>
                      <td>{formatDate(row.dueDate)}</td>
                      <td>{row.overdueDays ? `${row.overdueDays} day(s)` : '-'}</td>
                      <td>
                        <strong>{money(row.outstanding)}</strong>
                        <Badge variant={row.outstanding > 0 ? 'danger' : 'success'}>
                          {row.fineStatus}
                        </Badge>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Button size="sm" onClick={() => openAction(row, 'pay')} disabled={row.outstanding <= 0}>
                            <Wallet size={15} /> Pay
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openAction(row, 'waive')} disabled={row.outstanding <= 0}>
                            Waive
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={pagination?.page || 1} totalPages={pagination?.totalPages || 1} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState icon={CircleDollarSign} title="No fines in this view" description="Outstanding and overdue fines will appear here." />
        )}
      </div>

      <Modal
        isOpen={Boolean(target)}
        onClose={() => setTarget(null)}
        title={action === 'pay' ? 'Record fine payment' : 'Waive fine'}
        size="sm"
      >
        <div className="form-stack">
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            {target?.studentName} · {target?.bookTitle} · Outstanding {money(target?.outstanding)}
          </p>
          <Input
            label="Amount (NGN)"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          {action === 'pay' ? (
            <>
              <Select label="Payment method" value={method} onChange={(event) => setMethod(event.target.value)}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="pos">POS</option>
                <option value="online">Online</option>
              </Select>
              <Input label="Reference (optional)" value={reference} onChange={(event) => setReference(event.target.value)} />
            </>
          ) : (
            <Input label="Reason (optional)" value={reason} onChange={(event) => setReason(event.target.value)} />
          )}
          <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setTarget(null)}>Cancel</Button>
            <Button onClick={submit} loading={busy}>{action === 'pay' ? 'Record payment' : 'Waive fine'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Fines;
