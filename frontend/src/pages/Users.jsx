import { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Edit, Trash2, Power, Key, X, Search, Shield, CheckCircle2, XCircle, Clock, UserPlus } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all'); // all | pending | active | disabled

  // Approve modal
  const [approveTarget, setApproveTarget] = useState(null); // user object
  const [approveRoleId, setApproveRoleId] = useState('');
  const [actioning, setActioning] = useState(null);

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [formData, setFormData] = useState({
    username: '', email: '', password: '', full_name: '', phone: '', role_id: 2, is_active: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/roles'),
      ]);
      setUsers(usersRes.data.data || []);
      setRoles(rolesRes.data.data || []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username, email: user.email, password: '',
        full_name: user.full_name || '', phone: user.phone || '',
        role_id: user.role_id || roles[0]?.role_id || 2, is_active: !!user.is_active,
      });
    } else {
      setEditingUser(null);
      const defaultRoleId = roles.find(r => r.role_name === 'staff')?.role_id || roles[0]?.role_id || 2;
      setFormData({ username: '', email: '', password: '', full_name: '', phone: '', role_id: defaultRoleId, is_active: true });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.user_id}`, formData);
        toast.success('User updated');
      } else {
        await api.post('/users', formData);
        toast.success('User created');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
  };

  const handleApprove = async () => {
    if (!approveTarget || !approveRoleId) return;
    setActioning(approveTarget.user_id);
    try {
      await api.patch(`/users/${approveTarget.user_id}/approve`, { role_id: parseInt(approveRoleId) });
      const role = roles.find(r => r.role_id == approveRoleId);
      toast.success(`Approved ${approveTarget.username} as ${role?.role_name || 'user'}`);
      setApproveTarget(null);
      setApproveRoleId('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed');
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActioning(rejectTarget.user_id);
    try {
      await api.patch(`/users/${rejectTarget.user_id}/reject`, { reason: rejectReason });
      toast.success(`Rejected registration for ${rejectTarget.username}`);
      setRejectTarget(null);
      setRejectReason('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Rejection failed');
    } finally {
      setActioning(null);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await api.patch(`/users/${id}/toggle-active`);
      toast.success('Status toggled');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = prompt('Enter new password (min 6 chars):');
    if (!newPassword) return;
    try {
      await api.patch(`/users/${id}/reset-password`, { new_password: newPassword });
      toast.success('Password reset');
    } catch (error) {
      toast.error('Failed');
    }
  };

  const roleColors = {
    admin: 'badge-purple', supervisor: 'badge-info', staff: 'badge-success', auditor: 'badge-warning',
  };

  // Counts
  const pendingUsers = users.filter(u => u.account_status === 'pending');
  const activeUsers = users.filter(u => u.account_status === 'active');
  const disabledUsers = users.filter(u => u.account_status === 'disabled');

  // Filtered list per tab
  const tabFiltered = tab === 'pending' ? pendingUsers
    : tab === 'active' ? activeUsers
    : tab === 'disabled' ? disabledUsers
    : users;

  const filtered = tabFiltered.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { value: 'all', label: 'All', count: users.length },
    { value: 'pending', label: 'Pending', count: pendingUsers.length, accent: 'amber' },
    { value: 'active', label: 'Active', count: activeUsers.length },
    { value: 'disabled', label: 'Disabled', count: disabledUsers.length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="eyebrow">Access Control</p>
          <h1 className="page-title mt-1">Users</h1>
          <p className="page-subtitle">Manage users, roles, and pending registrations</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Pending banner */}
      {pendingUsers.length > 0 && tab !== 'pending' && (
        <button
          onClick={() => setTab('pending')}
          className="w-full text-left card p-4 ring-1 ring-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors group"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 ring-1 ring-amber-200 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-700" strokeWidth={2.2} />
              </div>
              <div>
                <p className="font-bold text-ink-900 font-display">
                  {pendingUsers.length} pending {pendingUsers.length === 1 ? 'registration' : 'registrations'}
                </p>
                <p className="text-sm text-ink-600">New users are waiting for role assignment.</p>
              </div>
            </div>
            <span className="btn-secondary !ring-amber-300 !text-amber-700 hover:!bg-amber-100 group-hover:translate-x-0.5 transition-transform">
              Review now →
            </span>
          </div>
        </button>
      )}

      {/* Tabs + Search */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex flex-wrap gap-2">
            {tabs.map(t => {
              const isActive = tab === t.value;
              const isAmber = t.accent === 'amber' && t.count > 0;
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? isAmber
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-moss-600 text-white shadow-md'
                      : isAmber
                        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100'
                        : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-moss-50 hover:text-moss-700 hover:ring-moss-200'
                  }`}
                >
                  {t.label}
                  <span className="ml-1.5 text-xs opacity-80">({t.count})</span>
                </button>
              );
            })}
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              placeholder="Search users by name, email or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-ink-200 border-t-moss-600 mx-auto"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-ink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UsersIcon className="w-8 h-8 text-ink-400" />
            </div>
            <h3 className="text-lg font-bold text-ink-900 font-display">
              {tab === 'pending' ? 'No pending registrations' : 'No users found'}
            </h3>
            <p className="text-sm text-ink-500 mt-1">
              {tab === 'pending' ? 'All registrations have been reviewed.' : 'Try adjusting your search or create a new user.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isPending = u.account_status === 'pending';
                  return (
                    <tr key={u.user_id} className={isPending ? 'bg-amber-50/40' : ''}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0 ${
                            isPending
                              ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                              : 'bg-gradient-to-br from-moss-500 to-accent-teal'
                          }`}>
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-ink-900 truncate">{u.username}</p>
                            {u.full_name && <p className="text-xs text-ink-500 truncate">{u.full_name}</p>}
                            {u.phone && <p className="text-xs text-ink-400 truncate">{u.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="text-ink-600">{u.email}</td>
                      <td>
                        {u.role_name ? (
                          <span className={`${roleColors[u.role_name] || 'badge-neutral'} capitalize`}>{u.role_name}</span>
                        ) : (
                          <span className="text-ink-400 text-sm italic">Not assigned</span>
                        )}
                      </td>
                      <td>
                        {u.account_status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 text-amber-700 bg-amber-50 ring-amber-200">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                        {u.account_status === 'active' && <span className="badge-success">Active</span>}
                        {u.account_status === 'disabled' && <span className="badge-neutral">Disabled</span>}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {isPending ? (
                            <>
                              <button
                                onClick={() => {
                                  setApproveTarget(u);
                                  setApproveRoleId(roles.find(r => r.role_name === 'staff')?.role_id || roles[0]?.role_id || '');
                                }}
                                disabled={actioning === u.user_id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-moss-600 text-white text-xs font-semibold hover:bg-moss-700 disabled:opacity-50 transition"
                                title="Approve"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => { setRejectTarget(u); setRejectReason(''); }}
                                disabled={actioning === u.user_id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white text-red-600 ring-1 ring-red-200 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition"
                                title="Reject"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => openModal(u)} className="btn-icon" title="Edit"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => handleResetPassword(u.user_id)} className="btn-icon" title="Reset password"><Key className="w-4 h-4" /></button>
                              <button onClick={() => handleToggleActive(u.user_id)} className="btn-icon" title="Toggle status"><Power className="w-4 h-4" /></button>
                              <button onClick={() => handleDelete(u.user_id)} className="btn-icon hover:!text-red-600 hover:!bg-red-50" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-panel w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
              <div>
                <h2 className="text-lg font-extrabold text-ink-900 font-display">{editingUser ? 'Edit User' : 'Add User'}</h2>
                <p className="text-xs text-ink-500 mt-0.5">{editingUser ? 'Update user details' : 'Create a new user account'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Username *</label>
                <input type="text" required className="input-field"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" required className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              {!editingUser && (
                <div>
                  <label className="label">Password *</label>
                  <input type="password" required className="input-field"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </div>
              )}
              <div>
                <label className="label">Full Name</label>
                <input type="text" className="input-field"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="tel" className="input-field"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Role *</label>
                <select required className="input-field"
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: parseInt(e.target.value) })}>
                  {roles.map((r) => (
                    <option key={r.role_id} value={r.role_id} className="capitalize">{r.role_name}</option>
                  ))}
                </select>
              </div>
              {editingUser && (
                <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
                  <input type="checkbox" className="rounded accent-moss-600"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                  Active account
                </label>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editingUser ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveTarget && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-panel w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-moss-50 ring-1 ring-moss-100 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-moss-700" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-ink-900 font-display">Approve User</h2>
                  <p className="text-xs text-ink-500 mt-0.5">Assign a role to activate this account</p>
                </div>
              </div>
              <button onClick={() => setApproveTarget(null)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-ink-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Registrant</p>
                <p className="font-bold text-ink-900 mt-0.5">{approveTarget.username}</p>
                <p className="text-sm text-ink-600">{approveTarget.email}</p>
                {approveTarget.full_name && <p className="text-sm text-ink-500">{approveTarget.full_name}</p>}
                <p className="text-xs text-ink-400 mt-2">
                  Registered {new Date(approveTarget.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="label">Assign role *</label>
                <select
                  required
                  value={approveRoleId}
                  onChange={(e) => setApproveRoleId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select role</option>
                  {roles.map((r) => (
                    <option key={r.role_id} value={r.role_id} className="capitalize">
                      {r.role_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-ink-500 mt-1.5">The user will be notified once approved.</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setApproveTarget(null)} className="btn-secondary">Cancel</button>
                <button
                  onClick={handleApprove}
                  disabled={!approveRoleId || actioning === approveTarget.user_id}
                  className="btn-primary"
                >
                  {actioning === approveTarget.user_id ? 'Approving...' : 'Approve & Activate'}
                </button>
              </div>
            </div>
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
                  <h2 className="text-lg font-extrabold text-ink-900 font-display">Reject Registration</h2>
                  <p className="text-xs text-ink-500 mt-0.5">This will permanently remove the registration</p>
                </div>
              </div>
              <button onClick={() => setRejectTarget(null)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-ink-50 rounded-xl p-4">
                <p className="font-bold text-ink-900">{rejectTarget.username}</p>
                <p className="text-sm text-ink-600">{rejectTarget.email}</p>
              </div>
              <div>
                <label className="label">Reason (optional)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="input-field"
                  rows="3"
                  placeholder="Why is this registration being rejected? (logged for audit)"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setRejectTarget(null)} className="btn-secondary">Cancel</button>
                <button
                  onClick={handleReject}
                  disabled={actioning === rejectTarget.user_id}
                  className="btn-danger"
                >
                  {actioning === rejectTarget.user_id ? 'Rejecting...' : 'Reject Registration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
