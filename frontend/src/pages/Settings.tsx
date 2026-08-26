import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Bell, DollarSign, Calendar, Package, UserCheck } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import type { SystemSettings } from '../types';

const Settings = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    app_name: 'Growventory',
    low_stock_threshold: '10',
    require_stock_approval: 'false',
    notification_email_enabled: 'false',
    currency: 'USD',
    date_format: 'YYYY-MM-DD',
    auto_approve_registrations: 'false',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(prev => ({ ...prev, ...data.data }));
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', { settings });
      toast.success('Settings saved');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div className="card p-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-ink-200 border-t-moss-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="eyebrow">Configuration</p>
        <h1 className="page-title mt-1">System Settings</h1>
        <p className="page-subtitle">Configure global system preferences and behavior</p>
      </div>

      {/* General */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-ink-100">
          <div className="w-11 h-11 bg-moss-50 ring-1 ring-moss-100 rounded-2xl flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-moss-700" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="font-bold text-ink-900 font-display">General</h2>
            <p className="text-sm text-ink-500">Basic application settings</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Currency</label>
              <select className="input-field"
                value={settings.currency}
                onChange={(e) => update('currency', e.target.value)}>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="INR">INR - Indian Rupee</option>
                <option value="NPR">NPR - Nepalese Rupee</option>
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date Format</label>
              <select className="input-field"
                value={settings.date_format}
                onChange={(e) => update('date_format', e.target.value)}>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-ink-100">
          <div className="w-11 h-11 bg-blue-50 ring-1 ring-blue-100 rounded-2xl flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-700" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="font-bold text-ink-900 font-display">Inventory</h2>
            <p className="text-sm text-ink-500">Stock management preferences</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Default Low-Stock Threshold</label>
            <input type="number" min="0" className="input-field"
              value={settings.low_stock_threshold}
              onChange={(e) => update('low_stock_threshold', e.target.value)} />
            <p className="text-xs text-ink-500 mt-1.5">Plants below this stock level will trigger alerts</p>
          </div>
          <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl hover:bg-ink-50/60 transition ring-1 ring-ink-100">
            <input type="checkbox" className="mt-0.5 rounded accent-ink-900"
              checked={settings.require_stock_approval === 'true'}
              onChange={(e) => update('require_stock_approval', e.target.checked ? 'true' : 'false')} />
            <div>
              <p className="font-bold text-ink-900 text-sm">Require approval for stock adjustments</p>
              <p className="text-xs text-ink-500 mt-0.5">Stock changes by staff need supervisor approval</p>
            </div>
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-ink-100">
          <div className="w-11 h-11 bg-amber-50 ring-1 ring-amber-100 rounded-2xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-amber-700" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="font-bold text-ink-900 font-display">Notifications</h2>
            <p className="text-sm text-ink-500">Alert preferences</p>
          </div>
        </div>
        <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl hover:bg-ink-50/60 transition ring-1 ring-ink-100">
          <input type="checkbox" className="mt-0.5 rounded accent-ink-900"
            checked={settings.notification_email_enabled === 'true'}
            onChange={(e) => update('notification_email_enabled', e.target.checked ? 'true' : 'false')} />
          <div>
            <p className="font-bold text-ink-900 text-sm">Email notifications</p>
            <p className="text-xs text-ink-500 mt-0.5">Send alerts via email (requires SMTP setup)</p>
          </div>
        </label>
      </div>

      {/* Access & Registration */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-ink-100">
          <div className="w-11 h-11 bg-purple-50 ring-1 ring-purple-100 rounded-2xl flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-purple-700" strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="font-bold text-ink-900 font-display">Access & Registration</h2>
            <p className="text-sm text-ink-500">Control how new users join the system</p>
          </div>
        </div>
        <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl hover:bg-ink-50/60 transition ring-1 ring-ink-100">
          <input type="checkbox" className="mt-0.5 rounded accent-moss-600"
            checked={settings.auto_approve_registrations === 'true'}
            onChange={(e) => update('auto_approve_registrations', e.target.checked ? 'true' : 'false')} />
          <div>
            <p className="font-bold text-ink-900 text-sm">Auto-approve new registrations</p>
            <p className="text-xs text-ink-500 mt-0.5">
              When enabled, new users are immediately activated as <span className="font-semibold">staff</span>.
              When disabled, registrations stay pending until an admin assigns a role.
            </p>
          </div>
        </label>
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary px-6">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
