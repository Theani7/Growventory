import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, HeartPulse, X, Filter, Calendar, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { HealthLog, Plant } from '../types';

const Health = () => {
  const { user } = useAuth();
  const canRecord = ['staff', 'supervisor', 'admin'].includes((user?.role_name ?? '').toLowerCase());
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlant, setFilterPlant] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ plant_id: '', health_status: 'healthy', growth_stage: '', notes: '' });

  useEffect(() => { fetchLogs(); fetchPlants(); }, []);

  useEffect(() => {
    const handleFocus = () => { fetchLogs(); fetchPlants(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = '/health/logs';
      const params = [];
      if (filterPlant) params.push(`plant_id=${filterPlant}`);
      if (filterStatus) params.push(`health_status=${filterStatus}`);
      if (params.length) url += `?${params.join('&')}`;
      const { data } = await api.get(url);
      setLogs(data.data || []);
    } catch {
      toast.error('Failed to fetch health logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlants = async () => {
    try {
      const { data } = await api.get('/plants');
      setPlants(data.data || []);
    } catch {}
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/health/logs', formData);
      toast.success('Health check recorded');
      setShowModal(false);
      setFormData({ plant_id: '', health_status: 'healthy', growth_stage: '', notes: '' });
      fetchLogs();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record check');
    } finally {
      setSubmitting(false);
    }
  };

  const statusMeta: Record<string, { color: string; label: string; dot: string; accent: string }> = {
    healthy: { color: 'text-moss-700 bg-moss-50 ring-moss-200', label: 'Healthy', dot: 'bg-moss-500', accent: 'bg-moss-50' },
    under_observation: { color: 'text-amber-700 bg-amber-50 ring-amber-200', label: 'Under Observation', dot: 'bg-amber-500', accent: 'bg-amber-50' },
    poor: { color: 'text-orange-700 bg-orange-50 ring-orange-200', label: 'Poor', dot: 'bg-orange-500', accent: 'bg-orange-50' },
    critical: { color: 'text-red-700 bg-red-50 ring-red-200', label: 'Critical', dot: 'bg-red-500', accent: 'bg-red-50' },
  };

  const counts: Record<string, number> = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.health_status] = (acc[l.health_status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Wellness</p>
          <h1 className="page-title mt-1">Plant Health</h1>
          <p className="page-subtitle">Monitor and track plant health status over time</p>
        </div>
        {canRecord && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Record Check
          </button>
        )}
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(statusMeta).map(([key, meta]) => (
          <div key={key} className="stat-card card-hover">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2.5 h-2.5 rounded-full ${meta.dot}`}></div>
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">{meta.label}</p>
            </div>
            <p className="stat-value">{counts[key] || 0}</p>
            <p className="text-xs text-ink-400 mt-1">total checks</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={filterPlant} onChange={(e) => setFilterPlant(e.target.value)} className="input-field flex-1">
            <option value="">All Plants</option>
            {plants.map((p) => <option key={p.plant_id} value={p.plant_id}>{p.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field sm:w-52">
            <option value="">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="under_observation">Under Observation</option>
            <option value="poor">Poor</option>
            <option value="critical">Critical</option>
          </select>
          <button onClick={fetchLogs} className="btn-primary">
            <Filter className="w-4 h-4" /> Apply
          </button>
        </div>
      </div>

      {/* Logs table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-ink-200 border-t-moss-600"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 bg-ink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HeartPulse className="w-8 h-8 text-ink-400" />
          </div>
          <h3 className="text-lg font-bold text-ink-900 font-display">No health logs yet</h3>
          <p className="text-sm text-ink-500 mt-1 mb-6">Start tracking plant health by recording your first check.</p>
          {canRecord && (
            <button onClick={() => setShowModal(true)} className="btn-primary inline-flex">
              <Plus className="w-4 h-4" /> Record Check
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Plant</th>
                  <th>Status</th>
                  <th>Growth Stage</th>
                  <th>Notes</th>
                  <th>Checked By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const meta = statusMeta[log.health_status] || statusMeta.healthy;
                  return (
                    <tr key={log.log_id}>
                      <td className="font-semibold text-ink-900">{log.plant_name}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${meta.color}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}></div>
                          {meta.label}
                        </span>
                      </td>
                      <td className="text-ink-600">{log.growth_stage || '—'}</td>
                      <td className="max-w-xs truncate text-ink-500">{log.notes || '—'}</td>
                      <td className="text-ink-600">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-ink-400" />
                          {log.checked_by_name || '—'}
                        </div>
                      </td>
                      <td className="text-ink-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-ink-400" />
                          {new Date(log.check_date).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-panel w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
              <div>
                <h2 className="text-lg font-extrabold text-ink-900 font-display">Record Health Check</h2>
                <p className="text-xs text-ink-500 mt-0.5">Log a plant health observation</p>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Plant *</label>
                <select required value={formData.plant_id} onChange={(e) => setFormData({ ...formData, plant_id: e.target.value })} className="input-field">
                  <option value="">Select plant</option>
                  {plants.map((p) => <option key={p.plant_id} value={p.plant_id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Health Status *</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(statusMeta).map(([key, meta]) => {
                    const active = formData.health_status === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, health_status: key })}
                        className={`p-3 rounded-xl ring-1 transition-all text-xs font-semibold flex items-center gap-2 ${
                          active ? 'ring-moss-600 bg-moss-600 text-white shadow-md' : 'ring-ink-200 hover:ring-moss-400 text-ink-600 bg-white'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${active ? 'bg-white' : meta.dot}`}></div>
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="label">Growth Stage</label>
                <input type="text" value={formData.growth_stage} onChange={(e) => setFormData({ ...formData, growth_stage: e.target.value })} className="input-field" placeholder="e.g. Seedling, Mature" />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-field" rows={2} placeholder="Observations..." />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Recording...' : 'Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Health;
