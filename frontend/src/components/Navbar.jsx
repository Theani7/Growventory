import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, Menu, Search, User, Settings, AlertTriangle, Heart, Info, Command } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const pageTitles = {
  '/dashboard': 'Overview',
  '/dashboard/plants': 'Plants',
  '/dashboard/categories': 'Categories',
  '/dashboard/stock': 'Stock',
  '/dashboard/health': 'Health',
  '/dashboard/tasks': 'Tasks',
  '/dashboard/reports': 'Reports',
  '/dashboard/logs': 'Activity Logs',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/users': 'Users',
  '/dashboard/settings': 'Settings',
};

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenIdRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  const showNotificationToast = (notif) => {
    const meta = {
      low_stock: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
      health_issue: { icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
      system: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' },
      task: { icon: Info, color: 'text-purple-600', bg: 'bg-purple-50' },
      approval: { icon: Info, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    };
    const m = meta[notif.type] || meta.system;
    const Icon = m.icon;

    toast.custom((t) => (
      <div
        className={`${t.visible ? 'animate-slide-up' : 'opacity-0'} max-w-md w-full bg-white shadow-elevated-lg rounded-2xl pointer-events-auto flex overflow-hidden cursor-pointer hover:shadow-elevated-lg transition-shadow ring-1 ring-ink-100`}
        onClick={() => {
          toast.dismiss(t.id);
          navigate('/dashboard/notifications');
        }}
      >
        <div className={`flex-shrink-0 w-12 ${m.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${m.color}`} />
        </div>
        <div className="flex-1 p-4 min-w-0">
          <p className="text-sm font-bold text-ink-900">{notif.title}</p>
          <p className="text-xs text-ink-600 mt-0.5 line-clamp-2">{notif.message}</p>
          <p className="text-[10px] text-ink-400 mt-1">Click to view all notifications</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
          className="px-3 text-ink-400 hover:text-ink-600 text-xl"
        >
          ×
        </button>
      </div>
    ), { duration: 6000, position: 'top-right' });
  };

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications');
      const notifications = data.data?.notifications || [];
      const count = data.data?.unread_count || 0;
      setUnreadCount(count);

      const unread = notifications.filter(n => !n.is_read);
      if (isFirstLoadRef.current) {
        if (unread.length > 0) {
          lastSeenIdRef.current = unread[0].notification_id;
        }
        isFirstLoadRef.current = false;
      } else if (lastSeenIdRef.current !== null) {
        const newOnes = unread.filter(n => n.notification_id > lastSeenIdRef.current);
        newOnes.reverse().forEach(showNotificationToast);
        if (newOnes.length > 0) {
          lastSeenIdRef.current = unread[0].notification_id;
        }
      } else if (unread.length > 0) {
        lastSeenIdRef.current = unread[0].notification_id;
      }
    } catch {}
  };

  useEffect(() => {
    // Auditors don't get notifications
    if (user?.role_name === 'auditor') return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    const handleFocus = () => fetchUnreadCount();
    const handleNotifUpdate = () => fetchUnreadCount();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('notifications-updated', handleNotifUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('notifications-updated', handleNotifUpdate);
    };
  }, [user?.role_name]);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
    setProfileOpen(false);
  };

  const confirmLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
    setShowLogoutConfirm(false);
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'badge-purple',
      supervisor: 'badge-info',
      staff: 'badge-success',
      auditor: 'badge-warning',
    };
    return styles[role] || 'badge-neutral';
  };

  const currentTitle = pageTitles[location.pathname] || 'Dashboard';

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-ink-100">
        <div className="flex items-center justify-between h-full px-4 lg:px-8">
          {/* Left */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={onMenuClick}
              className="lg:hidden btn-icon min-h-[44px] min-w-[44px]"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page title (mobile) / Search (desktop) */}
            <h2 className="lg:hidden font-bold text-ink-900 text-lg font-display tracking-tight truncate">
              {currentTitle}
            </h2>

            <div className="hidden lg:block flex-1 max-w-md">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 group-focus-within:text-ink-700 transition-colors" />
                <input
                  type="text"
                  placeholder="Search plants, categories, or anything..."
                  className="w-full pl-10 pr-12 py-2 bg-ink-50 rounded-xl text-sm text-ink-900 placeholder:text-ink-400 ring-1 ring-transparent
                             focus:outline-none focus:ring-1 focus:ring-ink-300 focus:bg-white transition-all"
                />
                <kbd className="hidden xl:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-ink-500 bg-white ring-1 ring-ink-200 rounded">
                  <Command className="w-2.5 h-2.5" /> K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {user?.role_name !== 'auditor' && (
              <button
                onClick={() => navigate('/dashboard/notifications')}
                className="btn-icon relative"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 bg-accent-coral rounded-full ring-2 ring-white text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Desktop user info */}
            <div className="hidden sm:flex items-center gap-3 pl-2 ml-1">
              <div className="text-right">
                <p className="text-sm font-bold text-ink-900 leading-tight">{user?.username}</p>
                <span className={`${getRoleBadge(user?.role_name)} mt-0.5 capitalize text-[10px] py-0`}>
                  {user?.role_name}
                </span>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-9 h-9 bg-gradient-to-br from-moss-500 to-accent-teal rounded-xl flex items-center justify-center text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-md ring-2 ring-white"
                >
                  {user?.username?.charAt(0).toUpperCase()}
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-elevated-lg ring-1 ring-ink-100 py-1 z-20 animate-fade-in">
                      <div className="px-3 py-2 border-b border-ink-100">
                        <p className="text-sm font-bold text-ink-900 truncate">{user?.username}</p>
                        <p className="text-xs text-ink-500 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => { navigate('/dashboard/settings'); setProfileOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </button>
                      {user?.role_name === 'admin' && (
                        <button
                          onClick={() => { navigate('/dashboard/settings'); setProfileOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>
                      )}
                      <div className="my-1 mx-2 h-px bg-ink-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mobile user menu */}
            <div className="sm:hidden relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 bg-gradient-to-br from-moss-500 to-accent-teal rounded-xl flex items-center justify-center text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-md ring-2 ring-white"
                aria-label="User menu"
              >
                {user?.username?.charAt(0).toUpperCase()}
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-elevated-lg ring-1 ring-ink-100 py-1 z-20 animate-fade-in">
                    <div className="px-4 py-3 border-b border-ink-100">
                      <p className="text-sm font-bold text-ink-900 truncate">{user?.username}</p>
                      <p className="text-xs text-ink-500 truncate">{user?.email}</p>
                      <span className={`${getRoleBadge(user?.role_name)} mt-1.5 capitalize text-[10px] py-0.5`}>
                        {user?.role_name}
                      </span>
                    </div>
                    <button
                      onClick={() => { navigate('/dashboard/settings'); setProfileOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-ink-700 hover:bg-ink-50 border-b border-ink-100"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    {user?.role_name === 'admin' && (
                      <button
                        onClick={() => { navigate('/dashboard/settings'); setProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-ink-700 hover:bg-ink-50 border-b border-ink-100"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative bg-white rounded-3xl shadow-elevated-lg max-w-md w-full overflow-hidden animate-slide-up">
            <div className="bg-gradient-to-br from-red-500 to-red-600 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white font-display">Confirm Logout</h3>
                  <p className="text-red-100 text-sm">You will be signed out</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-ink-600 text-sm leading-relaxed mb-6">
                Are you sure you want to logout? You'll need to sign in again to access your dashboard.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  Stay logged in
                </button>
                <button
                  onClick={confirmLogout}
                  className="btn-danger flex-1"
                >
                  Yes, logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
