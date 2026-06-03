import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Bell, AlertTriangle, Heart, Info, Check, CheckCheck,
  Clock, Package, UserCheck, ListTodo
} from 'lucide-react';

const typeMeta = {
  low_stock: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100', label: 'Low Stock' },
  health_issue: { icon: Heart, bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-100', label: 'Health' },
  system: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-100', label: 'System' },
  task: { icon: ListTodo, bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-100', label: 'Task' },
  approval: { icon: UserCheck, bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-100', label: 'Approval' },
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000);
    const handleFocus = () => fetchNotifications();
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

  const getTimeGroup = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now - date;
    const oneDay = 86400000;
    if (diff < oneDay) return 'Today';
    if (diff < oneDay * 2) return 'Yesterday';
    if (diff < oneDay * 7) return 'This Week';
    return 'Older';
  };

  const groupNotifications = (list) => {
    const groups = {};
    list.forEach((n) => {
      const group = getTimeGroup(n.created_at);
      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    });
    return ['Today', 'Yesterday', 'This Week', 'Older']
      .filter((g) => groups[g])
      .map((g) => ({ label: g, items: groups[g] }));
  };

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;
  const grouped = groupNotifications(filtered);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Updates</p>
          <h1 className="page-title mt-1">Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0
              ? `You have ${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}`
              : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-secondary">
            <CheckCheck className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

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
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xs font-bold text-ink-400 uppercase tracking-[0.12em]">
                  {group.label}
                </h3>
                <div className="flex-1 h-px bg-ink-100"></div>
              </div>

              <div className="space-y-1">
                {group.items.map((notification) => {
                  const meta = typeMeta[notification.type] || {
                    icon: Bell, bg: 'bg-ink-100', text: 'text-ink-600', ring: 'ring-ink-200', label: 'Info',
                  };
                  const Icon = meta.icon;
                  const unread = !notification.is_read;

                  return (
                    <div
                      key={notification.notification_id}
                      onClick={() => { if (unread) markAsRead(notification.notification_id); }}
                      className={`card-hover card-flat flex items-start gap-4 p-4 cursor-pointer transition-all ${
                        unread ? 'bg-moss-50/40 ring-moss-200' : ''
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${meta.bg} ${meta.text} ring-1 ${meta.ring} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className={`text-sm leading-snug ${
                                unread ? 'font-bold text-ink-900' : 'font-semibold text-ink-700'
                              }`}>
                                {notification.title}
                              </h3>
                              {unread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-moss-500 flex-shrink-0"></span>
                              )}
                            </div>
                            <p className="text-sm text-ink-600 mt-1 leading-relaxed">{notification.message}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center gap-1.5 text-xs text-ink-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span>
                                  {new Date(notification.created_at).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              <span className="chip text-[10px] py-0.5">{meta.label}</span>
                            </div>
                          </div>
                          {unread && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.notification_id);
                              }}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
