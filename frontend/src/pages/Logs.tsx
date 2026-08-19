import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  FileText, RefreshCw, User, Clock, Search, Filter, X,
  Plus, Edit3, Trash2, Activity as ActivityIcon, ArrowRight, Database
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ActivityLog } from '../types';

const ACTION_META: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  CREATE: { icon: Plus, color: 'text-moss-700 bg-moss-50 ring-moss-200', label: 'Create' },
  UPDATE: { icon: Edit3, color: 'text-blue-700 bg-blue-50 ring-blue-200', label: 'Update' },
  DELETE: { icon: Trash2, color: 'text-red-700 bg-red-50 ring-red-200', label: 'Delete' },
  LOGIN: { icon: User, color: 'text-purple-700 bg-purple-50 ring-purple-200', label: 'Login' },
  LOGOUT: { icon: ArrowRight, color: 'text-ink-700 bg-ink-100 ring-ink-200', label: 'Logout' },
};

const Logs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterTable, setFilterTable] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/dashboard/recent-activities?limit=100');
      setLogs(data.data || []);
    } catch {
      toast.error('Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    const handleFocus = () => fetchLogs();
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(fetchLogs, 30000);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const tables = Array.from(new Set(logs.map(l => l.table_name).filter(Boolean))).sort();
  const actions = Array.from(new Set(logs.map(l => l.action_type).filter(Boolean))).sort();

  const filtered = logs.filter(log => {
    if (search) {
      const haystack = `${log.username || ''} ${log.description || ''} ${log.table_name || ''}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    if (filterAction && log.action_type !== filterAction) return false;
    if (filterTable && log.table_name !== filterTable) return false;
    return true;
  });

  const hasActiveFilters = search || filterAction || filterTable;

  const clearFilters = () => {
    setSearch('');
    setFilterAction('');
    setFilterTable('');
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Audit Trail</p>
          <h1 className="page-title mt-1">Activity Logs</h1>
          <p className="page-subtitle">Read-only view of all system activity and user actions</p>
        </div>
        <button onClick={fetchLogs} className="btn-secondary">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-moss-50 text-moss-700 ring-1 ring-moss-100 flex items-center justify-center">
              <ActivityIcon className="w-5 h-5" strokeWidth={2.2} />
            </div>
          </div>
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Total Logs</p>
          <p className="stat-value mt-1">{logs.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 flex items-center justify-center">
              <User className="w-5 h-5" strokeWidth={2.2} />
            </div>
          </div>
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Active Users</p>
          <p className="stat-value mt-1">{new Set(logs.map(l => l.user_id)).size}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100 flex items-center justify-center">
              <Database className="w-5 h-5" strokeWidth={2.2} />
            </div>
          </div>
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Tables</p>
          <p className="stat-value mt-1">{tables.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 ring-1 ring-purple-100 flex items-center justify-center">
              <FileText className="w-5 h-5" strokeWidth={2.2} />
            </div>
          </div>
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Action Types</p>
          <p className="stat-value mt-1">{actions.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              placeholder="Search by user, description, or table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-400 hover:text-ink-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <select 
            value={filterAction} 
            onChange={(e) => setFilterAction(e.target.value)} 
            className="input-field lg:w-44"
          >
            <option value="">All Actions</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select 
            value={filterTable} 
            onChange={(e) => setFilterTable(e.target.value)} 
            className="input-field lg:w-44"
          >
            <option value="">All Tables</option>
            {tables.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="btn-secondary">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Active filters</span>
            <span className="text-xs font-semibold text-ink-500">
              {filtered.length} of {logs.length} logs
            </span>
          </div>
        )}
      </div>

      {/* Logs Timeline */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-ink-200 border-t-moss-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 bg-ink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ActivityIcon className="w-8 h-8 text-ink-400" />
          </div>
          <h3 className="text-lg font-bold text-ink-900 font-display">
            {hasActiveFilters ? 'No logs match your filters' : 'No activity logs yet'}
          </h3>
          <p className="text-sm text-ink-500 mt-1">
            {hasActiveFilters ? 'Try clearing the filters' : 'System activity will appear here'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>User</th>
                  <th>Description</th>
                  <th>Table</th>
                  <th>Record</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const meta = ACTION_META[log.action_type ?? ''] || { 
                    icon: ActivityIcon, 
                    color: 'text-ink-700 bg-ink-100 ring-ink-200', 
                    label: log.action_type || 'Activity' 
                  };
                  const Icon = meta.icon;
                  return (
                    <tr key={log.log_id}>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${meta.color}`}>
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </td>
                      <td>
                        {log.username ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-moss-500 to-accent-teal rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {log.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-ink-900">{log.username}</span>
                          </div>
                        ) : (
                          <span className="text-ink-400">System</span>
                        )}
                      </td>
                      <td className="max-w-md">
                        <p className="text-ink-700 line-clamp-2">{log.description || '—'}</p>
                      </td>
                      <td>
                        {log.table_name ? (
                          <span className="chip text-[10px]">{log.table_name}</span>
                        ) : '—'}
                      </td>
                      <td className="text-ink-500 tabular-nums">
                        {log.record_id ? `#${log.record_id}` : '—'}
                      </td>
                      <td className="text-ink-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-ink-400" />
                          <span className="font-medium" title={new Date(log.created_at).toLocaleString()}>
                            {formatTime(log.created_at)}
                          </span>
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
    </div>
  );
};

export default Logs;
