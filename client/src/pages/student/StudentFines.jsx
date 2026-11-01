import { useEffect, useState } from 'react';
import { CircleDollarSign, Receipt } from 'lucide-react';
import { Badge, EmptyState } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { finesApi } from '../../services/fines';
import { formatDate, formatDateTime } from '../../utils/dates';
import '../admin/Admin.css';
import '../Circulation.css';

const money = (value) => `NGN ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const StudentFines = () => {
  const showToast = useToast();
  const [data, setData] = useState({ total: 0, items: [], payments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    finesApi.my()
      .then((result) => {
        if (mounted) setData(result || { total: 0, items: [], payments: [] });
      })
      .catch((err) => {
        if (mounted) showToast(err.message || 'Could not load fines.', 'error');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [showToast]);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>My Fines</h1>
        <p>Outstanding library charges and your payment history.</p>
      </div>

      <div className="circulation-summary">
        <div className="summary-tile">
          <span>Outstanding balance</span>
          <strong style={{ color: data.total ? 'var(--danger)' : 'var(--success)' }}>{money(data.total)}</strong>
        </div>
        <div className="summary-tile">
          <span>Items</span>
          <strong>{data.items?.length || 0}</strong>
        </div>
        <div className="summary-tile">
          <span>Payments</span>
          <strong>{data.payments?.length || 0}</strong>
        </div>
      </div>

      <div className="content-card" style={{ marginBottom: '1.5rem' }}>
        <h2>Outstanding charges</h2>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        ) : data.items?.length ? (
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Book</th><th>Due date</th><th>Status</th><th>Amount</th></tr></thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.borrowingId}>
                    <td>{item.bookTitle}</td>
                    <td>{formatDate(item.dueDate)}</td>
                    <td><Badge variant={item.status === 'active' ? 'warning' : 'danger'}>{item.fineStatus || item.status}</Badge></td>
                    <td><strong>{money(item.amount)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={CircleDollarSign} title="No outstanding fines" description="You have no pending library charges." />
        )}
      </div>

      <div className="content-card">
        <h2>Payment history</h2>
        {data.payments?.length ? (
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Reference</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
              <tbody>
                {data.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.reference}</td>
                    <td>{money(payment.amount)}</td>
                    <td>{payment.method}</td>
                    <td>{formatDateTime(payment.paidAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Receipt} title="No payments yet" description="Fine payments recorded at the library will appear here." />
        )}
      </div>
    </div>
  );
};

export default StudentFines;
