import { useState, useEffect } from 'react';
import { ClipboardList, Plus, Edit, Trash2, X, Calendar, Flag, CheckCircle2, Clock, Circle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Tasks = () => {
  const { user } = useAuth();
  const isManager = user?.role_name === 'admin';
  
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formData, setFormData] = useState({
    title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', status: 'pending',
  });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const url = filterStatus ? `/tasks?status=${filterStatus}` : '/tasks';
      const { data } = await api.get(url);
      setTasks(data.data || []);
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!isManager) return;
    try {
      const { data } = await api.get('/users');
      setUsers((data.data || []).filter(u => u.is_active));
    } catch (error) { /* admin only */ }
  };

  useEffect(() => { fetchTasks(); }, [filterStatus]);
  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    const handleFocus = () => fetchTasks();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [filterStatus]);

  const openModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title, description: task.description || '',
        assigned_to: task.assigned_to, priority: task.priority,
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        status: task.status,
      });
    } else {
      setEditingTask(null);
      setFormData({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', status: 'pending' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask.task_id}`, formData);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', formData);
        toast.success('Task created');
      }
      setShowModal(false);
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

   const handleStatusChange = async (id, status) => {
     try {
       await api.patch(`/tasks/${id}/status`, { status });
       toast.success('Status updated');
       fetchTasks();
     } catch (error) {
       toast.error(error.response?.data?.message || 'Failed to update status');
     }
   };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      toast.success('Task deleted');
      setDeleteTarget(null);
      fetchTasks();
    } catch (error) {
      toast.error('Failed');
    }
  };

  const priorityMeta = {
    low: { class: 'badge-neutral', icon: Flag },
    medium: { class: 'badge-info', icon: Flag },
    high: { class: 'badge-warning', icon: Flag },
    urgent: { class: 'badge-danger', icon: AlertCircle },
  };

  const statusMeta = {
    pending: { icon: Circle, color: 'text-ink-400', bgColor: 'bg-ink-100', label: 'Pending' },
    in_progress: { icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'In Progress' },
    completed: { icon: CheckCircle2, color: 'text-moss-600', bgColor: 'bg-moss-50', label: 'Done' },
    cancelled: { icon: X, color: 'text-red-500', bgColor: 'bg-red-50', label: 'Cancelled' },
  };

  const statusFilters = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  // Counts per status (computed from current tasks list)
  const counts = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="eyebrow">Workflow</p>
          <h1 className="page-title mt-1">Tasks</h1>
          <p className="page-subtitle">{isManager ? 'Assign and manage team tasks' : 'Your assigned tasks'}</p>
        </div>
        {isManager && (
          <button onClick={() => openModal()} className="btn-primary">
            <Plus className="w-4 h-4" /> New Task
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map(f => {
          const isActive = filterStatus === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilterStatus(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isActive 
                  ? 'bg-moss-600 text-white shadow-md' 
                  : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-moss-50 hover:text-moss-700 hover:ring-moss-200'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {loading ? (
          <div className="card p-12 text-center text-ink-500">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-ink-200 border-t-moss-600 mx-auto"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 bg-ink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-ink-400" />
            </div>
            <h3 className="text-lg font-bold text-ink-900 font-display">No tasks {filterStatus && `(${filterStatus})`}</h3>
            <p className="text-sm text-ink-500 mt-1">Tasks you create or get assigned will appear here.</p>
          </div>
        ) : (
          tasks.map((task) => {
            const sMeta = statusMeta[task.status] || statusMeta.pending;
            const StatusIcon = sMeta.icon;
            const pMeta = priorityMeta[task.priority] || priorityMeta.medium;
            const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
            return (
              <div key={task.task_id} className="card card-hover p-5 group">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleStatusChange(task.task_id, task.status === 'completed' ? 'pending' : 'completed')}
                    className={`mt-0.5 w-9 h-9 rounded-xl ${sMeta.bgColor} flex items-center justify-center hover:scale-110 transition-transform flex-shrink-0`}
                  >
                    <StatusIcon className={`w-5 h-5 ${sMeta.color}`} strokeWidth={2.5} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-ink-900 font-display tracking-tight ${task.status === 'completed' ? 'line-through opacity-50' : ''}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-ink-600 mt-1 leading-relaxed">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          <span className={pMeta.class}>
                            <Flag className="w-3 h-3" /> {task.priority}
                          </span>
                          {task.due_date && (
                            <span className={isOverdue ? 'badge-danger' : 'badge-neutral'}>
                              <Calendar className="w-3 h-3" />
                              {new Date(task.due_date).toLocaleDateString()}
                              {isOverdue && ' (overdue)'}
                            </span>
                          )}
                          <span className="text-xs text-ink-500">
                            Assigned to <span className="font-bold text-ink-900">{task.assigned_to_name}</span>
                          </span>
                        </div>
                      </div>
                      {isManager && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(task)} className="btn-icon"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteTarget(task)} className="btn-icon hover:!text-red-600 hover:!bg-red-50"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                    {(task.assigned_to === user?.user_id || isManager) && task.status !== 'completed' && (
                      <div className="flex gap-2 mt-3">
                        {task.status !== 'in_progress' && (
                          <button onClick={() => handleStatusChange(task.task_id, 'in_progress')} className="btn-ghost text-xs">
                            Start
                          </button>
                        )}
                        <button onClick={() => handleStatusChange(task.task_id, 'completed')} className="btn-ghost text-xs text-moss-700">
                          Mark complete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-panel w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
              <div>
                <h2 className="text-lg font-extrabold text-ink-900 font-display">{editingTask ? 'Edit Task' : 'New Task'}</h2>
                <p className="text-xs text-ink-500 mt-0.5">{editingTask ? 'Update task details' : 'Create a new task'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input type="text" required className="input-field"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea rows="3" className="input-field"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div>
                <label className="label">Assign To *</label>
                <select required className="input-field"
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}>
                  <option value="">Select user</option>
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id}>{u.username} ({u.role_name})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Priority</label>
                  <select className="input-field"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" className="input-field"
                    value={formData.due_date}
                    min={new Date().toLocaleDateString('en-CA')}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                </div>
              </div>
              {editingTask && (
                <div>
                  <label className="label">Status</label>
                  <select className="input-field"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">{editingTask ? 'Update' : 'Create'}</button>
              </div>
            </form>
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
                  <h2 className="text-lg font-extrabold text-ink-900 font-display">Delete Task</h2>
                  <p className="text-xs text-ink-500 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 rounded-xl p-4 ring-1 ring-red-100">
                <p className="font-bold text-ink-900">{deleteTarget.title}</p>
                {deleteTarget.description && <p className="text-sm text-ink-600 mt-0.5 line-clamp-2">{deleteTarget.description}</p>}
              </div>
              <p className="text-sm text-ink-600">Are you sure you want to delete this task?</p>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
                <button onClick={() => handleDelete(deleteTarget.task_id)} className="btn-danger">Delete Task</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
