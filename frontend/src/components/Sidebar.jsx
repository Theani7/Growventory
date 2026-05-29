import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Leaf, LayoutDashboard, Sprout, FolderTree, ArrowLeftRight, 
  HeartPulse, FileBarChart, Bell, Users, ClipboardList, Settings,
  LogOut, ChevronUp, ScrollText
} from 'lucide-react';

const Sidebar = ({ onClose, collapsed = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role_name;
  const [menuOpen, setMenuOpen] = useState(false);

  const mainNav = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Overview', end: true, roles: ['admin', 'supervisor', 'staff'] },
    { path: '/dashboard/plants', icon: Sprout, label: 'Plants', roles: ['admin', 'supervisor', 'staff'] },
    { path: '/dashboard/categories', icon: FolderTree, label: 'Categories', roles: ['admin', 'supervisor', 'staff'] },
    { path: '/dashboard/stock', icon: ArrowLeftRight, label: 'Stock', roles: ['admin', 'supervisor', 'staff'] },
    { path: '/dashboard/health', icon: HeartPulse, label: 'Health', roles: ['admin', 'supervisor', 'staff'] },
    { path: '/dashboard/tasks', icon: ClipboardList, label: 'Tasks', roles: ['admin', 'supervisor', 'staff'] },
  ];

  const insightsNav = [
    { path: '/dashboard/reports', icon: FileBarChart, label: 'Reports', roles: ['admin', 'supervisor', 'auditor'] },
    { path: '/dashboard/logs', icon: ScrollText, label: 'Activity Logs', roles: ['admin', 'supervisor', 'auditor'] },
    { path: '/dashboard/notifications', icon: Bell, label: 'Notifications', roles: ['admin', 'supervisor', 'staff'] },
  ];

  const adminNav = [
    { path: '/dashboard/users', icon: Users, label: 'Users', roles: ['admin'] },
    { path: '/dashboard/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
  ];

  const filterByRole = (items) => items.filter(item => item.roles.includes(role));
  const visibleMain = filterByRole(mainNav);
  const visibleInsights = filterByRole(insightsNav);
  const visibleAdmin = filterByRole(adminNav);

  const renderNavItem = (item) => (
    <NavLink
      key={item.path}
      to={item.path}
      end={item.end}
      onClick={onClose}
      className={({ isActive }) => isActive ? 'nav-link-active min-h-[44px]' : 'nav-link min-h-[44px]'}
      title={collapsed ? item.label : undefined}
    >
      {({ isActive }) => (
        <>
          <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-moss-700' : 'text-ink-400'}`} strokeWidth={isActive ? 2.4 : 2} />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );

  const renderSection = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-0.5">
        {!collapsed && (
          <p className="text-[10px] font-bold text-ink-400 uppercase tracking-[0.14em] px-3 mb-2 mt-5">
            {title}
          </p>
        )}
        {collapsed && <div className="my-3 mx-3 h-px bg-ink-100" />}
        {items.map(renderNavItem)}
      </div>
    );
  };

  return (
    <aside className={`h-full bg-white border-r border-ink-100 flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className={`px-5 py-5 ${collapsed ? 'px-3' : ''}`}>
        <NavLink to="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
          <div className="w-10 h-10 bg-gradient-to-br from-moss-500 via-moss-600 to-accent-teal rounded-xl flex items-center justify-center shadow-lg shadow-moss-600/20 flex-shrink-0">
            <Leaf className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-extrabold text-base text-ink-900 tracking-tight font-display leading-none">Growventory</h1>
              <p className="text-[11px] text-ink-500 mt-1">Nursery Management</p>
            </div>
          )}
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-bold text-ink-400 uppercase tracking-[0.14em] px-3 mb-2">
            Main
          </p>
        )}
        <div className="space-y-0.5">
          {visibleMain.map(renderNavItem)}
        </div>

        {renderSection('Insights', visibleInsights)}
        {renderSection('Administration', visibleAdmin)}
      </nav>

      {/* User card */}
      <div className={`p-3 border-t border-ink-100 ${collapsed ? 'px-2' : ''}`}>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-moss-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-moss-500 to-accent-teal rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-semibold text-sm text-ink-900 truncate">{user?.username}</p>
                  <p className="text-[11px] text-ink-500 capitalize">{user?.role_name}</p>
                </div>
                <ChevronUp className={`w-4 h-4 text-ink-400 flex-shrink-0 transition-transform ${menuOpen ? '' : 'rotate-180'}`} />
              </>
            )}
          </button>

          {menuOpen && !collapsed && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-white ring-1 ring-ink-100 rounded-xl shadow-elevated-lg py-1 z-20 animate-slide-down">
                {role === 'admin' && (
                  <>
                    <button
                      onClick={() => { navigate('/dashboard/settings'); setMenuOpen(false); onClose && onClose(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-moss-50 hover:text-moss-800"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <div className="my-1 mx-2 h-px bg-ink-100" />
                  </>
                )}
                <button
                  onClick={() => { logout(); navigate('/login'); }}
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
    </aside>
  );
};

export default Sidebar;