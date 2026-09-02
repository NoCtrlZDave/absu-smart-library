import { useState } from 'react';
import { Settings2, BookOpen, Bell, Save } from 'lucide-react';
import { Button, Input, Select } from '../../components/common';
import './Admin.css';

const Settings = () => {
  const [settings, setSettings] = useState({
    libraryName: 'ABSU Smart Library',
    timezone: 'Africa/Lagos',
    language: 'English',
    dateFormat: 'MM/DD/YYYY',

    borrowDuration: 14,
    maxBooksPerStudent: 5,
    renewalLimit: 2,
    overdueFinePerDay: 50,
    reservationHoldDays: 2,

    emailNotifications: true,
    smsNotifications: false,
    overdueReminders: true,
    reservationNotifications: true,
    systemAlerts: true
  });

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleToggle = (field) => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>System Settings</h1>
        <p>Configure system-wide preferences and rules.</p>
      </div>

      <div className="content-card">
        <div className="settings-group">
          <h3>
            <Settings2 size={18} style={{ color: 'var(--primary)' }} />
            General Settings
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Library Name</label>
              <Input
                value={settings.libraryName}
                onChange={(e) => handleChange('libraryName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Timezone</label>
              <Select value={settings.timezone} onChange={(e) => handleChange('timezone', e.target.value)}>
                <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
              </Select>
            </div>
            <div className="form-group">
              <label>Language</label>
              <Select value={settings.language} onChange={(e) => handleChange('language', e.target.value)}>
                <option value="English">English</option>
                <option value="French">French</option>
                <option value="Spanish">Spanish</option>
              </Select>
            </div>
            <div className="form-group">
              <label>Date Format</label>
              <Select value={settings.dateFormat} onChange={(e) => handleChange('dateFormat', e.target.value)}>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </Select>
            </div>
          </div>
        </div>

        <div className="settings-group">
          <h3>
            <BookOpen size={18} style={{ color: 'var(--primary)' }} />
            Borrowing Rules
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Borrow Duration (days)</label>
              <Input
                name="borrowDuration"
                type="number"
                value={settings.borrowDuration}
                onChange={(e) => handleChange(e.target.name, parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Max Books Per Student</label>
              <Input
                name="maxBooksPerStudent"
                type="number"
                value={settings.maxBooksPerStudent}
                onChange={(e) => handleChange(e.target.name, parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Renewal Limit</label>
              <Input
                name="renewalLimit"
                type="number"
                value={settings.renewalLimit}
                onChange={(e) => handleChange(e.target.name, parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Overdue Fine (₦/day)</label>
              <Input
                name="overdueFinePerDay"
                type="number"
                value={settings.overdueFinePerDay}
                onChange={(e) => handleChange(e.target.name, parseInt(e.target.value))}
              />
            </div>
            <div className="form-group">
              <label>Reservation Hold (days)</label>
              <Input
                name="reservationHoldDays"
                type="number"
                value={settings.reservationHoldDays}
                onChange={(e) => handleChange(e.target.name, parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="settings-group">
          <h3>
            <Bell size={18} style={{ color: 'var(--primary)' }} />
            Notifications
          </h3>
          <div className="settings-item">
            <div>
              <div className="settings-item-label">Email Notifications</div>
              <div className="settings-item-description">Send notifications via email</div>
            </div>
            <button
              className={`toggle-switch ${settings.emailNotifications ? 'active' : ''}`}
              onClick={() => handleToggle('emailNotifications')}
            />
          </div>

          <div className="settings-item">
            <div>
              <div className="settings-item-label">SMS Notifications</div>
              <div className="settings-item-description">Send notifications via SMS</div>
            </div>
            <button
              className={`toggle-switch ${settings.smsNotifications ? 'active' : ''}`}
              onClick={() => handleToggle('smsNotifications')}
            />
          </div>

          <div className="settings-item">
            <div>
              <div className="settings-item-label">Overdue Reminders</div>
              <div className="settings-item-description">Notify users about overdue books</div>
            </div>
            <button
              className={`toggle-switch ${settings.overdueReminders ? 'active' : ''}`}
              onClick={() => handleToggle('overdueReminders')}
            />
          </div>

          <div className="settings-item">
            <div>
              <div className="settings-item-label">Reservation Notifications</div>
              <div className="settings-item-description">Notify users when reservations are ready</div>
            </div>
            <button
              className={`toggle-switch ${settings.reservationNotifications ? 'active' : ''}`}
              onClick={() => handleToggle('reservationNotifications')}
            />
          </div>

          <div className="settings-item">
            <div>
              <div className="settings-item-label">System Alerts</div>
              <div className="settings-item-description">Receive system health and security alerts</div>
            </div>
            <button
              className={`toggle-switch ${settings.systemAlerts ? 'active' : ''}`}
              onClick={() => handleToggle('systemAlerts')}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <Button onClick={handleSave}>
            <Save size={18} />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
