import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Bell, AlertTriangle, Heart, Info, Check, CheckCheck } from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    const handleFocus = () => fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data?.notifications || []);
      setUnreadCount(data.data?.unread_count || 0);
    } catch {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((list) => list.map((n) => (n.notification_id === id ? { ...n, is_read: 1 } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      window.dispatchEvent(new Event('notifications-updated'));
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((list) => list.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      window.dispatchEvent(new Event('notifications-updated'));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const typeMeta = {
    low_stock: { icon: AlertTriangle, color: 'bg-amber-50 text-amber-600 ring-amber-100', label: 'Low Stock' },
    health_issue: { icon: Heart, color: 'bg-rose-50 text-rose-600 ring-rose-100', label: 'Health' },
    system: { icon: Info, color: 'bg-blue-50 text-blue-600 ring-blue-100', label: 'System' },
    task: { icon: Info, color: 'bg-purple-50 text-purple-600 ring-purple-100', label: 'Task' },
    approval: { icon: Info, color: 'bg-indigo-50 text-indigo-600 ring-indigo-100', label: 'Approval' },
  };

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Updates</p>
          <h1 className="page-title mt-1">Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0 ? `You have ${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-secondary">
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            filter === 'all' 
              ? 'bg-moss-600 text-white shadow-md' 
              : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-moss-50 hover:text-moss-700 hover:ring-moss-200'
          }`}
        >
          All <span className="ml-1 text-xs opacity-70">({notifications.length})</span>
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            filter === 'unread' 
              ? 'bg-moss-600 text-white shadow-md' 
              : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-moss-50 hover:text-moss-700 hover:ring-moss-200'
          }`}
        >
          Unread <span className="ml-1 text-xs opacity-70">({unreadCount})</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-ink-200 border-t-moss-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 bg-ink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-ink-400" />
          </div>
          <h3 className="text-lg font-bold text-ink-900 font-display">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-sm text-ink-500 mt-1">
            {filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here'}
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-ink-100 overflow-hidden">
          {filtered.map((notification) => {
            const meta = typeMeta[notification.type] || { icon: Bell, color: 'bg-ink-100 text-ink-600 ring-ink-200', label: 'Info' };
            const Icon = meta.icon;
            const unread = !notification.is_read;
            return (
              <div
                key={notification.notification_id}
                className={`flex items-start gap-4 p-5 transition-colors ${
                  unread ? 'bg-moss-50/40' : 'hover:bg-ink-50/40'
                }`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ring-1 ${meta.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm ${unread ? 'font-bold text-ink-900' : 'font-semibold text-ink-700'}`}>
                          {notification.title}
                        </h3>
                        {unread && <div className="w-2 h-2 rounded-full bg-moss-500 flex-shrink-0"></div>}
                      </div>
                      <p className="text-sm text-ink-600 mt-1 leading-relaxed">{notification.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-ink-400">
                          {new Date(notification.created_at).toLocaleString()}
                        </span>
                        <span className="chip text-[10px] py-0.5">{meta.label}</span>
                      </div>
                    </div>
                    {unread && (
                      <button
                        onClick={() => markAsRead(notification.notification_id)}
                        className="btn-icon flex-shrink-0"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
