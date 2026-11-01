import { useEffect, useState } from 'react';
import { BellRing, Mail, MessageCircle, Save, Send, Smartphone } from 'lucide-react';
import { Badge, Button, Input, Select } from '../../components/common';
import { useToast } from '../../components/common/useToast';
import { notificationsApi } from '../../services/notifications';
import { formatDateTime } from '../../utils/dates';
import './Admin.css';

const CHANNEL_ICON = { email: Mail, sms: Smartphone, whatsapp: MessageCircle };

const NotificationSettings = () => {
  const showToast = useToast();
  const [status, setStatus] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ subject: '', body: '' });
  const [channels, setChannels] = useState(['email']);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [statusData, templateData, deliveryData] = await Promise.all([
        notificationsApi.integrationStatus(),
        notificationsApi.templates(),
        notificationsApi.deliveries({ limit: 10 }),
      ]);
      setStatus(statusData);
      setTemplates(templateData?.templates || []);
      setDeliveries(deliveryData?.items || []);
    } catch (err) {
      showToast(err.message || 'Could not load notification settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const edit = (template) => {
    setEditing(template.event);
    setForm({ subject: template.subject, body: template.body });
  };

  const save = async () => {
    setBusy(true);
    try {
      await notificationsApi.saveTemplate(editing, form);
      showToast('Template saved.', 'success');
      setEditing(null);
      await load();
    } catch (err) {
      showToast(err.message || 'Could not save template.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const runTest = async () => {
    setBusy(true);
    try {
      const result = await notificationsApi.test(channels);
      const failed = (result?.deliveries || []).filter((item) => item.status !== 'sent');
      showToast(
        failed.length
          ? `Test dispatched. ${failed.length} channel(s) not sent: ${failed.map((item) => `${item.channel} (${item.status})`).join(', ')}`
          : 'Test notification sent.',
        failed.length ? 'warning' : 'success'
      );
      await load();
    } catch (err) {
      showToast(err.message || 'Could not send test notification.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const runReminders = async () => {
    setBusy(true);
    try {
      const result = await notificationsApi.runReminders();
      showToast(result?.skipped ? result.reason : `Reminders processed: ${result.sent} sent.`, result?.skipped ? 'info' : 'success');
      await load();
    } catch (err) {
      showToast(err.message || 'Could not run reminders.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleChannel = (channel) => {
    setChannels((prev) => (prev.includes(channel) ? prev.filter((item) => item !== channel) : [...prev, channel]));
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Notifications</h1>
        <p>Provider integration, message templates and delivery history.</p>
      </div>

      <div className="content-card" style={{ marginBottom: '1.5rem' }}>
        <h2>Provider status</h2>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        ) : (
          <>
            <div className="circulation-summary">
              {['email', 'sms', 'whatsapp'].map((channel) => {
                const Icon = CHANNEL_ICON[channel];
                return (
                  <div className="summary-tile" key={channel}>
                    <span><Icon size={16} /> {channel}</span>
                    <strong style={{ color: status?.[channel]?.configured ? 'var(--success)' : 'var(--danger)' }}>
                      {status?.[channel]?.configured ? 'Configured' : 'Not configured'}
                    </strong>
                  </div>
                );
              })}
            </div>
            <p className="inline-note">
              In-app notifications are always delivered. Email, SMS and WhatsApp require server
              environment variables: {Object.values(status?.requiredEnvironment || {}).flat().join(', ')}.
            </p>
            <div className="table-actions" style={{ marginTop: '1rem' }}>
              <Select value={channels[0] || 'email'} onChange={(event) => setChannels([event.target.value])} style={{ maxWidth: 200 }}>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </Select>
              <Button variant="outline" onClick={() => toggleChannel(channels[0] || 'email')} style={{ display: 'none' }} />
              <Button onClick={runTest} loading={busy}><Send size={16} /> Send test</Button>
              <Button variant="outline" onClick={runReminders} loading={busy}><BellRing size={16} /> Run reminders</Button>
            </div>
          </>
        )}
      </div>

      <div className="content-card" style={{ marginBottom: '1.5rem' }}>
        <h2>Message templates</h2>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Event</th><th>Subject</th><th>Body</th><th>Source</th><th>Actions</th></tr></thead>
            <tbody>
              {templates.map((template) => (
                <tr key={template.event}>
                  <td>{template.event.replaceAll('_', ' ')}</td>
                  <td>{template.subject}</td>
                  <td><span className="cell-note">{template.body}</span></td>
                  <td><Badge variant={template.overridden ? 'info' : 'maintenance'}>{template.overridden ? 'Custom' : 'Default'}</Badge></td>
                  <td><Button size="sm" variant="outline" onClick={() => edit(template)}>Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="content-card" style={{ marginBottom: '1.5rem' }}>
          <h2>Edit template: {editing}</h2>
          <div className="form-stack">
            <Input label="Subject" value={form.subject} onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))} />
            <div className="form-group">
              <label>Body</label>
              <textarea
                className="input"
                rows={4}
                value={form.body}
                onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
              />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Placeholders: {'{{name}}'}, {'{{bookTitle}}'}, {'{{dueDate}}'}, {'{{fine}}'}, {'{{amount}}'}, {'{{reference}}'}, {'{{outstanding}}'}, {'{{deadline}}'}, {'{{copyCode}}'}, {'{{reason}}'}.
            </p>
            <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save} loading={busy}><Save size={16} /> Save template</Button>
            </div>
          </div>
        </div>
      )}

      <div className="content-card">
        <h2>Recent deliveries</h2>
        {deliveries.length ? (
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>Channel</th><th>Destination</th><th>Status</th><th>Error</th><th>Date</th></tr></thead>
              <tbody>
                {deliveries.map((item) => (
                  <tr key={item.id}>
                    <td>{item.channel}</td>
                    <td>{item.destination || '-'}</td>
                    <td><Badge variant={item.status === 'sent' ? 'success' : item.status === 'failed' ? 'danger' : 'warning'}>{item.status}</Badge></td>
                    <td><span className="cell-note">{item.error || '-'}</span></td>
                    <td>{formatDateTime(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No delivery attempts recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;
