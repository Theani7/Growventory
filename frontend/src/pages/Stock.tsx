import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  Plus, ArrowDownToLine, ArrowUpFromLine, RefreshCw, X, Filter,
  ArrowLeftRight, Calendar, CheckCircle2, XCircle, Clock, ShieldCheck, Trash2
} from 'lucide-react';
import type { Plant, StockMovement } from '../types';

const Stock = () => {
  const { user } = useAuth();
  const isApprover = ['admin', 'supervisor'].includes(user?.role_name?.toLowerCase() ?? '');

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlant, setFilterPlant] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actioning, setActioning] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<StockMovement | null>(null);
  const [formData, setFormData] = useState({ plant_id: '', movement_type: 'IN', quantity: '', notes: '' });
  const filtersRef = useRef({ plant: '', type: '', status: '' });
  filtersRef.current = { plant: filterPlant, type: filterType, status: filterStatus };

  useEffect(() => { fetchMovements(); fetchPlants(); }, []);

  useEffect(() => {
    const handleFocus = () => { fetchMovements(); fetchPlants(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchMovements = async (overrides: { plant?: string; type?: string; status?: string } = {}) => {
    const f = { ...filtersRef.current, ...overrides };
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.plant) params.set('plant_id', f.plant);
      if (f.type) params.set('movement_type', f.type);
      if (f.status) params.set('status', f.status);
      const url = '/stock/movements' + (params.toString() ? `?${params}` : '');
      const { data } = await api.get(url);
      setMovements(data.data || []);
    } catch {
      toast.error('Failed to fetch movements');
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
    const qty = Number(formData.quantity);
    const isAdj = formData.movement_type === 'ADJUSTMENT';
    if (!Number.isInteger(qty) || (isAdj ? qty < 0 : qty <= 0)) {
      toast.error(isAdj ? 'Quantity must be 0 or greater.' : 'Quantity must be a positive integer.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/stock/movements', { ...formData, quantity: qty });
      toast.success(data.message || 'Movement recorded');
      setShowModal(false);
      setFormData({ plant_id: '', movement_type: 'IN', quantity: '', notes: '' });
      fetchMovements();
      fetchPlants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to record movement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActioning(id);
    try {
      await api.patch(`/stock/movements/${id}/approve`);
      toast.success('Movement approved & applied');
      fetchMovements();
      fetchPlants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Approval failed');
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActioning(rejectTarget);
    try {
      await api.patch(`/stock/movements/${rejectTarget}/reject`, { reason: rejectReason });
      toast.success('Movement rejected');
      setRejectTarget(null);
      setRejectReason('');
      fetchMovements();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Rejection failed');
    } finally {
      setActioning(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/stock/movements/${id}`);
      toast.success('Movement deleted');
      setDeleteTarget(null);
      fetchMovements();
      fetchPlants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const movementMeta = (type: string) => {
    if (type === 'IN') return { icon: ArrowDownToLine, label: 'Stock In', color: 'text-moss-700 bg-moss-50 ring-moss-200' };
    if (type === 'OUT') return { icon: ArrowUpFromLine, label: 'Stock Out', color: 'text-red-700 bg-red-50 ring-red-200' };
    return { icon: RefreshCw, label: 'Adjustment', color: 'text-blue-700 bg-blue-50 ring-blue-200' };
  };

  const statusMeta = (status: string) => {
    if (status === 'approved') return { icon: CheckCircle2, label: 'Approved', color: 'text-moss-700 bg-moss-50 ring-moss-200' };
    if (status === 'rejected') return { icon: XCircle, label: 'Rejected', color: 'text-red-700 bg-red-50 ring-red-200' };
    return { icon: Clock, label: 'Pending', color: 'text-amber-700 bg-amber-50 ring-amber-200' };
  };

  // Stats from approved movements only (for accurate totals)
  const totals = movements.reduce((acc, m) => {
    if (m.approval_status !== 'approved') {
      if (m.approval_status === 'pending') acc.pending += 1;
      return acc;
    }
    if (m.movement_type === 'IN') acc.in += m.quantity;
    if (m.movement_type === 'OUT') acc.out += m.quantity;
    if (m.movement_type === 'ADJUSTMENT') acc.adj += 1;
    return acc;
  }, { in: 0, out: 0, adj: 0, pending: 0 });

  const hasActiveFilters = filterPlant || filterType || filterStatus;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Movements</p>
          <h1 className="page-title mt-1">Stock</h1>
          <p className="page-subtitle">Track inventory transactions and approve adjustments</p>
        </div>
        <div className="flex gap-2">
          {totals.pending > 0 && isApprover && (
            <button
              onClick={() => { setFilterStatus('pending'); fetchMovements({ status: 'pending' }); }}
              className="btn-secondary !ring-amber-200 !text-amber-700 hover:!bg-amber-50"
            >
              <Clock className="w-4 h-4" /> {totals.pending} Pending
            </button>
          )}
          {user && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Record Movement
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card card-hover">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-moss-50 text-moss-700 ring-1 ring-moss-100 flex items-center justify-center">
              <ArrowDownToLine className="w-5 h-5" strokeWidth={2.2} />
            </div>
          </div>
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Stock In</p>
          <p className="stat-value mt-1">{totals.in}</p>
          <p className="text-xs text-ink-400 mt-1">approved units</p>
        </div>
        <div className="stat-card card-hover">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-700 ring-1 ring-red-100 flex items-center justify-center">
              <ArrowUpFromLine className="w-5 h-5" strokeWidth={2.2} />
            </div>
          </div>
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Stock Out</p>
          <p className="stat-value mt-1">{totals.out}</p>
          <p className="text-xs text-ink-400 mt-1">approved units</p>
        </div>
        <div className="stat-card card-hover">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" strokeWidth={2.2} />
            </div>
          </div>
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Adjustments</p>
          <p className="stat-value mt-1">{totals.adj}</p>
          <p className="text-xs text-ink-400 mt-1">approved</p>
        </div>
        <div className="stat-card card-hover">
          <div className="flex items-start justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5" strokeWidth={2.2} />
            </div>
          </div>
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Pending</p>
          <p className="stat-value mt-1">{totals.pending}</p>
          <p className="text-xs text-ink-400 mt-1">{isApprover ? 'awaiting your review' : 'awaiting approval'}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <select
            value={filterPlant}
            onChange={(e) => setFilterPlant(e.target.value)}
            className="input-field flex-1 min-w-[160px]"
          >
            <option value="">All Plants</option>
            {plants.map((p) => <option key={p.plant_id} value={p.plant_id}>{p.name}</option>)}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field sm:w-44"
          >
            <option value="">All Types</option>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field sm:w-40"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <div className="flex gap-2">
            <button onClick={fetchMovements} className="btn-primary">
              <Filter className="w-4 h-4" /> Apply
            </button>
            {hasActiveFilters && (
              <button
                onClick={() => { setFilterPlant(''); setFilterType(''); setFilterStatus(''); fetchMovements({ plant: '', type: '', status: '' }); }}
                className="btn-secondary"
              >
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Active:</span>
              {filterPlant && (
                <span className="chip">
                  Plant: {plants.find(p => String(p.plant_id) === filterPlant)?.name || filterPlant}
                  <button onClick={() => setFilterPlant('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filterType && (
                <span className="chip">
                  Type: {filterType}
                  <button onClick={() => setFilterType('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filterStatus && (
                <span className="chip capitalize">
                  Status: {filterStatus}
                  <button onClick={() => setFilterStatus('')}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-ink-500">
              {movements.length} {movements.length === 1 ? 'movement' : 'movements'} found
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-ink-200 border-t-moss-600"></div>
        </div>
      ) : movements.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 bg-ink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ArrowLeftRight className="w-8 h-8 text-ink-400" />
          </div>
          <h3 className="text-lg font-bold text-ink-900 font-display">No movements yet</h3>
          <p className="text-sm text-ink-500 mt-1 mb-6">Record your first stock movement.</p>
          {user && (
            <button onClick={() => setShowModal(true)} className="btn-primary inline-flex">
              <Plus className="w-4 h-4" /> Record Movement
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
                  <th>Type</th>
                  <th className="text-center">Qty</th>
                  <th className="text-center">Status</th>
                  <th>Requested By</th>
                  <th>Approver</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const meta = movementMeta(m.movement_type);
                  const Icon = meta.icon;
                  const sMeta = statusMeta(m.approval_status);
                  const SIcon = sMeta.icon;
                  const isPending = m.approval_status === 'pending';
                  return (
                    <tr key={m.movement_id} className={isPending ? 'bg-amber-50/30' : ''}>
                      <td>
                        <div>
                          <p className="font-semibold text-ink-900">{m.plant_name}</p>
                          {m.notes && <p className="text-xs text-ink-500 mt-0.5 truncate max-w-[220px]" title={m.notes}>{m.notes}</p>}
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${meta.color}`}>
                          <Icon className="w-3 h-3" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="text-center font-bold tabular-nums">
                        {m.quantity}
                        {m.approval_status === 'approved' && (
                          <span className="block text-[10px] text-ink-400 font-normal">
                            {m.previous_stock} → {m.new_stock}
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${sMeta.color}`}>
                          <SIcon className="w-3 h-3" />
                          {sMeta.label}
                        </span>
                      </td>
                      <td className="text-ink-700">{m.created_by_name || '-'}</td>
                      <td className="text-ink-500">{m.approved_by_name || '-'}</td>
                      <td className="text-ink-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-ink-400" />
                          {new Date(m.movement_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1">
                          {isPending && isApprover && (
                            <>
                              <button
                                onClick={() => handleApprove(m.movement_id)}
                                disabled={actioning === m.movement_id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-moss-600 text-white text-xs font-semibold hover:bg-moss-700 disabled:opacity-50 transition"
                                title="Approve"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => { setRejectTarget(m.movement_id); setRejectReason(''); }}
                                disabled={actioning === m.movement_id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-red-600 ring-1 ring-red-200 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition"
                                title="Reject"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </>
                          )}
                          {isApprover && (
                            <button
                              onClick={() => setDeleteTarget(m)}
                              className="btn-icon hover:!text-red-600 hover:!bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Add Movement Modal */}
      {showModal && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-panel w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
              <div>
                <h2 className="text-lg font-extrabold text-ink-900 font-display">Record Movement</h2>
                <p className="text-xs text-ink-500 mt-0.5">
                  {user?.role_name?.toLowerCase() === 'staff'
                    ? 'May require supervisor approval'
                    : 'Auto-approved as supervisor/admin'}
                </p>
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
                  {plants.map((p) => <option key={p.plant_id} value={p.plant_id}>{p.name} (Stock: {p.current_stock})</option>)}
                </select>
              </div>
              <div>
                <label className="label">Movement Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['IN', 'OUT', 'ADJUSTMENT'].map((t) => {
                    const meta = movementMeta(t);
                    const Icon = meta.icon;
                    const active = formData.movement_type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, movement_type: t })}
                        className={`p-3 rounded-xl ring-1 transition-all text-xs font-semibold flex flex-col items-center gap-1.5 ${
                          active ? 'ring-moss-600 bg-moss-600 text-white shadow-md' : 'ring-ink-200 hover:ring-moss-400 text-ink-600 bg-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="label">{formData.movement_type === 'ADJUSTMENT' ? 'New absolute stock *' : 'Quantity *'}</label>
                <input type="number" required min={formData.movement_type === 'ADJUSTMENT' ? 0 : 1} value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="input-field" placeholder="0" />
                {formData.movement_type === 'ADJUSTMENT' && (
                  <p className="text-xs text-ink-500 mt-1">Adjustment sets the absolute stock value.</p>
                )}
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-field" rows={2} placeholder="Optional notes..." />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : (user?.role_name?.toLowerCase() === 'staff' ? 'Submit' : 'Record')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-panel w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 ring-1 ring-red-100 rounded-xl flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-ink-900 font-display">Reject Movement</h2>
                  <p className="text-xs text-ink-500 mt-0.5">Add a reason (optional)</p>
                </div>
              </div>
              <button onClick={() => setRejectTarget(null)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Rejection reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Why is this being rejected?"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setRejectTarget(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleReject} disabled={actioning === rejectTarget} className="btn-danger">
                  {actioning === rejectTarget ? 'Rejecting...' : 'Reject Movement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-panel w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 ring-1 ring-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-ink-900 font-display">Delete Movement</h2>
                  <p className="text-xs text-ink-500 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 rounded-xl p-4 ring-1 ring-red-100">
                <p className="font-bold text-ink-900">{deleteTarget.plant_name}</p>
                <p className="text-sm text-ink-600">Type: {deleteTarget.movement_type} &nbsp;|&nbsp; Qty: {deleteTarget.quantity}</p>
                {deleteTarget.notes && <p className="text-sm text-ink-500 mt-0.5">{deleteTarget.notes}</p>}
              </div>
              <div className="bg-amber-50 rounded-xl p-4 ring-1 ring-amber-200">
                <p className="text-sm text-amber-800 font-semibold">⚠️ Warning</p>
                <p className="text-xs text-amber-700 mt-1">Approved movements will reverse the stock change when deleted.</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
                <button onClick={() => handleDelete(deleteTarget.movement_id)} className="btn-danger">Delete Movement</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;
