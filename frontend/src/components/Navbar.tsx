import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, Menu, Search, User, AlertTriangle, Heart, Info, Command, Check, ListTodo, UserCheck, X, Sparkles, Sprout, FolderOpen } from 'lucide-react';
import Avatar from './Avatar';
import type { LucideIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import type { Notification, Plant, Category } from '../types';

const pageTitles: Record<string, string> = {
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
};

const Navbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenIdRef = useRef<number | null>(null);
  const isFirstLoadRef = useRef(true);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ plants: Plant[]; categories: Category[] }>({ plants: [], categories: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const showNotificationToast = (notif: Notification) => {
    const meta: Record<string, { icon: LucideIcon; bg: string; text: string; ring: string; label: string }> = {
      low_stock: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100', label: 'Low Stock' },
      health_issue: { icon: Heart, bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-100', label: 'Health' },
      system: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-100', label: 'System' },
      task: { icon: ListTodo, bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-100', label: 'Task' },
      approval: { icon: UserCheck, bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-100', label: 'Approval' },
    };
    const m = meta[notif.type] || meta.system;
    const Icon = m.icon;

    toast.custom((t) => (
      <div
        className={`${t.visible ? 'animate-slide-up' : 'opacity-0'} max-w-sm w-full bg-white shadow-elevated-lg rounded-2xl pointer-events-auto overflow-hidden cursor-pointer hover:shadow-elevated-lg transition-shadow ring-1 ring-ink-100`}
        onClick={() => {
          toast.dismiss(t.id);
          navigate('/dashboard/notifications');
        }}
      >
        <div className="flex items-start gap-3.5 p-4">
          <div className={`w-10 h-10 rounded-xl ${m.bg} ${m.text} ring-1 ${m.ring} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-ink-900">{notif.title}</p>
              <span className="chip text-[10px] py-0">{m.label}</span>
            </div>
            <p className="text-xs text-ink-600 mt-0.5 line-clamp-2">{notif.message}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); toast.dismiss(t.id); }}
            className="flex-shrink-0 w-7 h-7 rounded-lg bg-ink-50 hover:bg-ink-100 text-ink-400 hover:text-ink-600 flex items-center justify-center transition-all -mr-1 -mt-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    ), { duration: 6000, position: 'top-right' });
  };

  const fetchUnreadCount = async () => {
    try {
      const { data } = await api.get('/notifications');
      const notifications = data.data?.notifications || [];
      const count = data.data?.unread_count || 0;
      setUnreadCount(count);

      const unread = (notifications as Notification[]).filter(n => !n.is_read);
      if (isFirstLoadRef.current) {
        if (unread.length > 0) {
          lastSeenIdRef.current = unread[0].notification_id;
        }
        isFirstLoadRef.current = false;
      } else if (lastSeenIdRef.current !== null) {
        const newOnes = unread.filter(n => n.notification_id > lastSeenIdRef.current!);
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
    if (user?.role_name?.toLowerCase() === 'auditor') return;
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

  const getRoleBadge = (role?: string) => {
    const styles: Record<string, string> = {
      admin: 'badge-purple',
      supervisor: 'badge-info',
      staff: 'badge-success',
      auditor: 'badge-warning',
    };
    return styles[role?.toLowerCase() ?? ''] || 'badge-neutral';
  };

  const currentTitle = pageTitles[location.pathname] || 'Dashboard';

  // Search handlers
  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setSearchQuery('');
    setSearchResults({ plants: [], categories: [] });
    setSearchSelectedIndex(-1);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults({ plants: [], categories: [] });
    setSearchSelectedIndex(-1);
  }, []);

  // Cmd+K / Ctrl+K toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      }
      if (e.key === 'Escape' && searchOpen) {
        closeSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, openSearch, closeSearch]);

  // Focus input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Click outside to close
  useEffect(() => {
    if (!searchOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen, closeSearch]);

  // Debounced search with AbortController to cancel stale requests
  useEffect(() => {
    if (!searchOpen || !searchQuery.trim()) {
      searchAbortRef.current?.abort();
      setSearchResults({ plants: [], categories: [] });
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      // Abort previous in-flight request
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      try {
        const [plantsRes, categoriesRes] = await Promise.all([
          api.get(`/plants?search=${encodeURIComponent(searchQuery)}&limit=5`, { signal: controller.signal }),
          api.get('/categories', { signal: controller.signal }),
        ]);
        const plants = (plantsRes.data.data || []) as Plant[];
        const allCategories = (categoriesRes.data.data || []) as Category[];
        const q = searchQuery.toLowerCase();
        const categories = allCategories.filter(c => c.category_name.toLowerCase().includes(q)).slice(0, 5);
        setSearchResults({ plants, categories });
      } catch (err: any) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED' || controller.signal.aborted) return;
        setSearchResults({ plants: [], categories: [] });
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
          setSearchSelectedIndex(-1);
        }
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      searchAbortRef.current?.abort();
    };
  }, [searchQuery, searchOpen]);

  const searchResultItems: { type: 'plant' | 'category'; id: number; label: string; subtitle: string; icon: LucideIcon }[] = [
    ...searchResults.plants.map(p => ({ type: 'plant' as const, id: p.plant_id, label: p.name, subtitle: p.scientific_name || p.category_name || 'Plant', icon: Sprout })),
    ...searchResults.categories.map(c => ({ type: 'category' as const, id: c.category_id, label: c.category_name, subtitle: `${c.plant_count || 0} plants`, icon: FolderOpen })),
  ];

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchSelectedIndex(prev => Math.min(prev + 1, searchResultItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchSelectedIndex >= 0 && searchSelectedIndex < searchResultItems.length) {
        const item = searchResultItems[searchSelectedIndex];
        if (item.type === 'plant') {
          navigate(`/dashboard/plants?search=${encodeURIComponent(item.label)}`);
        } else {
          navigate(`/dashboard/categories`);
        }
        closeSearch();
      }
    }
  };

  const handleResultClick = (item: typeof searchResultItems[0]) => {
    if (item.type === 'plant') {
      navigate(`/dashboard/plants?search=${encodeURIComponent(item.label)}`);
    } else {
      navigate(`/dashboard/categories`);
    }
    closeSearch();
  };

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
            <div className="lg:hidden flex items-center gap-2">
              <h2 className="font-bold text-ink-900 text-lg font-display tracking-tight truncate">
                {currentTitle}
              </h2>
            </div>

            <div className="hidden lg:block flex-1 max-w-md">
              <div className="relative group" ref={searchDropdownRef}>
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 group-focus-within:text-ink-700 transition-colors" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search plants, categories, or anything..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={openSearch}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-10 pr-12 py-2 bg-ink-50 rounded-xl text-sm text-ink-900 placeholder:text-ink-400 ring-1 ring-transparent
                             focus:outline-none focus:ring-1 focus:ring-ink-300 focus:bg-white transition-all"
                />
                <kbd className="hidden xl:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-ink-500 bg-white ring-1 ring-ink-200 rounded">
                  <Command className="w-2.5 h-2.5" /> K
                </kbd>

                {/* Search dropdown */}
                {searchOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-elevated-lg ring-1 ring-ink-100 overflow-hidden z-50">
                    {!searchQuery.trim() && (
                      <div className="px-4 py-8 text-center text-ink-400 text-sm">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        Type to search plants and categories...
                      </div>
                    )}
                    {searchLoading && (
                      <div className="px-4 py-6 text-center text-ink-400 text-sm">
                        <div className="animate-spin w-5 h-5 border-2 border-ink-300 border-t-transparent rounded-full mx-auto mb-2" />
                        Searching...
                      </div>
                    )}
                    {!searchLoading && searchQuery.trim() && searchResultItems.length === 0 && (
                      <div className="px-4 py-6 text-center text-ink-400 text-sm">
                        No results found for "{searchQuery}"
                      </div>
                    )}
                    {!searchLoading && searchResultItems.length > 0 && (
                      <div className="max-h-80 overflow-y-auto py-2">
                        {searchResults.plants.length > 0 && (
                          <div>
                            <div className="px-3 py-1.5 text-[10px] font-semibold text-ink-400 uppercase tracking-wider">Plants</div>
                            {searchResults.plants.map((plant, idx) => (
                              <button
                                key={`plant-${plant.plant_id}`}
                                onClick={() => handleResultClick({ type: 'plant', id: plant.plant_id, label: plant.name, subtitle: plant.scientific_name || plant.category_name || 'Plant', icon: Sprout })}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                                  searchResultItems[idx]?.id === plant.plant_id && searchResultItems[idx]?.type === 'plant' && searchSelectedIndex === idx
                                    ? 'bg-ink-50'
                                    : 'hover:bg-ink-50'
                                }`}
                              >
                                <div className="w-8 h-8 rounded-lg bg-moss-50 text-moss-600 flex items-center justify-center flex-shrink-0">
                                  <Sprout className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-ink-900 truncate">{plant.name}</p>
                                  <p className="text-xs text-ink-500 truncate">{plant.scientific_name || plant.category_name}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {searchResults.categories.length > 0 && (
                          <div>
                            <div className="px-3 py-1.5 text-[10px] font-semibold text-ink-400 uppercase tracking-wider">Categories</div>
                            {searchResults.categories.map((cat, catIdx) => {
                              const globalIdx = searchResults.plants.length + catIdx;
                              return (
                                <button
                                  key={`cat-${cat.category_id}`}
                                  onClick={() => handleResultClick({ type: 'category', id: cat.category_id, label: cat.category_name, subtitle: `${cat.plant_count || 0} plants`, icon: FolderOpen })}
                                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                                    searchSelectedIndex === globalIdx ? 'bg-ink-50' : 'hover:bg-ink-50'
                                  }`}
                                >
                                  <div className="w-8 h-8 rounded-lg bg-accent-teal/10 text-accent-teal flex items-center justify-center flex-shrink-0">
                                    <FolderOpen className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-ink-900 truncate">{cat.category_name}</p>
                                    <p className="text-xs text-ink-500 truncate">{cat.plant_count || 0} plants</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="border-t border-ink-100 px-3 py-2 flex items-center gap-3 text-[10px] text-ink-400">
                      <span className="flex items-center gap-1"><kbd className="font-mono bg-ink-50 px-1 rounded">↑↓</kbd> navigate</span>
                      <span className="flex items-center gap-1"><kbd className="font-mono bg-ink-50 px-1 rounded">↵</kbd> select</span>
                      <span className="flex items-center gap-1"><kbd className="font-mono bg-ink-50 px-1 rounded">esc</kbd> close</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5">
            {user?.role_name?.toLowerCase() !== 'auditor' && (
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
                  className="w-9 h-9 rounded-xl overflow-hidden border border-stone-200 shadow-sm ring-2 ring-white hover:opacity-90 transition-opacity p-0"
                >
                  <Avatar username={user?.username} size={36} className="w-full h-full" />
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
                        onClick={() => { setProfileOpen(false); navigate('/dashboard/profile'); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </button>

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
                className="w-9 h-9 rounded-xl overflow-hidden border border-stone-200 shadow-sm ring-2 ring-white hover:opacity-90 transition-opacity p-0"
                aria-label="User menu"
              >
                <Avatar username={user?.username} size={36} className="w-full h-full" />
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
                      onClick={() => { setProfileOpen(false); navigate('/dashboard/profile'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-ink-700 hover:bg-ink-50 border-b border-ink-100"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>

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
