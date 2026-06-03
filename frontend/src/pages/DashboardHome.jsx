import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Sprout, AlertTriangle, HeartPulse, Package, ArrowUpRight, 
  TrendingUp, Activity, Clock, RefreshCw, Info, ChevronRight, Sparkles
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import Tooltip from '../components/Tooltip';

const StatCard = ({ label, value, icon: Icon, accent = 'moss', trend, helpText }) => {
  const accents = {
    moss: { bg: 'bg-moss-50', text: 'text-moss-700', ring: 'ring-moss-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-100' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100' },
    red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-100' },
  };
  const a = accents[accent];
  return (
    <div className="stat-card card-hover group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl ${a.bg} ${a.text} ring-1 ${a.ring} flex items-center justify-center`}>
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </div>
        {helpText && (
          <Tooltip text={helpText} position="left">
            <Info className="w-3.5 h-3.5 text-ink-400 hover:text-ink-600 cursor-help" />
          </Tooltip>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider">{label}</p>
      </div>
      <p className="stat-value mt-1">{value}</p>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-moss-600">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

const DashboardHome = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [activities, setActivities] = useState([]);
  const [healthSummary, setHealthSummary] = useState([]);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);

  useEffect(() => { fetchDashboardData(); }, []); 

  useEffect(() => {
    const handleFocus = () => fetchDashboardData();
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(fetchDashboardData, 15000);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, lowStockRes, categoryRes, activityRes, healthRes, analyticsRes] = await Promise.all([
        api.get('/dashboard/overview'),
        api.get('/dashboard/low-stock'),
        api.get('/dashboard/category-stats'),
        api.get('/dashboard/recent-activities'),
        api.get('/dashboard/health-summary'),
        api.get('/dashboard/advanced-analytics'),
      ]);
      setOverview(overviewRes.data.data);
      setLowStock(lowStockRes.data.data || []);
      setCategoryStats(categoryRes.data.data || []);
      setActivities(activityRes.data.data || []);
      setHealthSummary(healthRes.data.data || []);
      setAdvancedAnalytics(analyticsRes.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch dashboard data');
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const HEALTH_COLORS = {
    healthy: '#2ba059',
    under_observation: '#f5a623',
    poor: '#f97316',
    critical: '#ff6b6b',
  };

  const formatHealthLabel = (s) => s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-ink-200 border-t-moss-600"></div>
      </div>
    );
  }

  const healthIssueCount = healthSummary
    ?.filter(h => h.health_status === 'poor' || h.health_status === 'critical')
    .reduce((acc, h) => acc + h.count, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Hero / Greeting */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-moss-700 via-moss-600 to-accent-teal p-6 sm:p-8 lg:p-10 shadow-elevated-lg">
        <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-1/3 w-48 sm:w-72 h-48 sm:h-72 bg-accent-mint/20 rounded-full blur-3xl translate-y-1/2"></div>
        <div className="absolute -top-12 -left-12 sm:-top-20 sm:-left-20 w-48 sm:w-72 h-48 sm:h-72 bg-moss-300/10 rounded-full blur-3xl"></div>
        <div className="relative flex flex-col lg:flex-row items-start lg:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-[10px] sm:text-[11px] font-semibold text-white ring-1 ring-white/20 mb-3 sm:mb-4">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {getGreeting()}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display">
              Welcome back, {user?.full_name?.split(' ')[0] || user?.username}
            </h1>
            <p className="text-white/80 mt-2 text-xs sm:text-sm max-w-xl">
              Here's a snapshot of your nursery operations. Track plants, monitor stock levels, and stay on top of everything.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl text-xs sm:text-sm font-semibold text-white transition-all ring-1 ring-white/20 flex-shrink-0 min-h-[44px]"
            title="Refresh dashboard"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          label="Total Plants" 
          value={overview?.total_plants || 0} 
          icon={Sprout} 
          accent="moss"
          helpText="Total active plants in inventory"
        />
        <StatCard 
          label="Total Stock" 
          value={overview?.total_stock || 0} 
          icon={Package} 
          accent="blue"
          helpText="Sum of all plant stock quantities"
        />
        <StatCard 
          label="Low Stock" 
          value={overview?.low_stock_count || 0} 
          icon={AlertTriangle} 
          accent="amber"
          helpText="Plants below minimum threshold"
        />
        <StatCard 
          label="Health Issues" 
          value={healthIssueCount} 
          icon={HeartPulse} 
          accent="red"
          helpText="Plants in poor or critical state"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Health distribution */}
        <div className="card p-4 sm:p-6 lg:col-span-1">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <p className="eyebrow">Distribution</p>
              <h2 className="section-title mt-1">Plant Health</h2>
            </div>
          </div>
          {healthSummary.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180} className="text-xs">
                <PieChart>
                  <Pie
                    data={healthSummary}
                    dataKey="count"
                    nameKey="health_status"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    cornerRadius={4}
                  >
                    {healthSummary.map((entry, index) => (
                      <Cell key={index} fill={HEALTH_COLORS[entry.health_status] || '#9ba4b5'} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    contentStyle={{
                      background: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '11px',
                      boxShadow: '0 12px 32px -8px rgba(17, 24, 28, 0.12)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {healthSummary.map((item) => (
                  <div key={item.health_status} className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-md"
                        style={{ background: HEALTH_COLORS[item.health_status] || '#9ba4b5' }}
                      ></div>
                      <span className="text-ink-600 truncate">{formatHealthLabel(item.health_status)}</span>
                    </div>
                    <span className="font-bold text-ink-900 tabular-nums">{item.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-ink-400 text-sm">No data available</div>
          )}
        </div>

        {/* Stock by Category */}
        <div className="card p-4 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div>
              <p className="eyebrow">Inventory</p>
              <h2 className="section-title mt-1">Stock by Category</h2>
            </div>
          </div>
          {categoryStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={240} className="text-xs">
              <BarChart data={categoryStats} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
                <XAxis
                  dataKey="category_name"
                  tick={{ fontSize: 10, fill: '#727b8e' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 10, fill: '#727b8e' }} axisLine={false} tickLine={false} />
                <ChartTooltip
                  cursor={{ fill: '#f7f8fa' }}
                  contentStyle={{
                    background: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '11px',
                    boxShadow: '0 12px 32px -8px rgba(17, 24, 28, 0.12)',
                  }}
                />
                <Bar dataKey="total_stock" fill="#1d8147" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-ink-400 text-sm">No data available</div>
          )}
        </div>
      </div>

      {/* Advanced Analytics */}
      {advancedAnalytics && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="eyebrow">Insights</p>
              <h2 className="section-title mt-1">Advanced Analytics</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="font-bold text-ink-900 mb-4">Stock Movement Trends · 30 days</h3>
              {advancedAnalytics.stock_trends && advancedAnalytics.stock_trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={advancedAnalytics.stock_trends} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#727b8e' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#727b8e' }} axisLine={false} tickLine={false} />
                    <ChartTooltip
                      cursor={{ fill: '#f7f8fa' }}
                      contentStyle={{
                        background: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '12px',
                        boxShadow: '0 12px 32px -8px rgba(17, 24, 28, 0.12)',
                      }}
                    />
                    <Bar dataKey="stock_in" fill="#2ba059" radius={[6, 6, 0, 0]} name="Stock In" />
                    <Bar dataKey="stock_out" fill="#ff6b6b" radius={[6, 6, 0, 0]} name="Stock Out" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-ink-400 text-sm">No stock movement data</div>
              )}
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-ink-900 mb-4">Category Performance</h3>
              {advancedAnalytics.category_performance && advancedAnalytics.category_performance.length > 0 ? (
                <div className="space-y-1">
                  {advancedAnalytics.category_performance.slice(0, 5).map((category, index) => {
                    const max = Math.max(...advancedAnalytics.category_performance.map(c => c.total_stock || 0));
                    const pct = max > 0 ? ((category.total_stock || 0) / max) * 100 : 0;
                    return (
                      <div key={index} className="py-2.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-moss-50 text-moss-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {index + 1}
                            </div>
                            <p className="text-sm font-semibold text-ink-900 truncate">{category.category_name}</p>
                          </div>
                          <p className="text-sm font-bold text-ink-900 ml-3 tabular-nums">{category.total_stock || 0}</p>
                        </div>
                        <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-moss-500 to-accent-teal rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                        </div>
                        <p className="text-xs text-ink-500 mt-1">{category.plant_count} plants</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-ink-400 text-sm">No category data</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="section-title">Low Stock Alerts</h2>
            </div>
            {lowStock.length > 0 && (
              <span className="badge-warning">{lowStock.length} items</span>
            )}
          </div>
          {lowStock.length > 0 ? (
            <div className="space-y-1.5 max-h-72 overflow-y-auto -mx-2 pr-1">
              {lowStock.slice(0, 6).map((plant) => (
                <div key={plant.plant_id} className="flex items-center justify-between p-3 mx-2 rounded-xl hover:bg-amber-50/50 transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-amber-50 ring-1 ring-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Sprout className="w-4.5 h-4.5 text-amber-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-ink-900 truncate">{plant.name}</p>
                      <p className="text-xs text-ink-500">Min threshold: {plant.min_stock_threshold}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-amber-700 tabular-nums">{plant.current_stock}</p>
                      <p className="text-[10px] text-ink-500 uppercase tracking-wide font-semibold">in stock</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-moss-50 rounded-2xl flex items-center justify-center mb-2">
                <ArrowUpRight className="w-5 h-5 text-moss-600" />
              </div>
              <p className="text-sm font-bold text-ink-700">All stock levels healthy</p>
              <p className="text-xs text-ink-500 mt-0.5">No items below threshold</p>
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-moss-50 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-moss-700" />
              </div>
              <h2 className="section-title">Recent Activity</h2>
            </div>
          </div>
          {activities.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {activities.slice(0, 6).map((activity) => (
                <div key={activity.log_id} className="flex items-start gap-3 group">
                  <div className="relative flex flex-col items-center flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-moss-50 ring-1 ring-moss-100 flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-moss-500"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <p className="text-sm text-ink-800 leading-snug">{activity.description}</p>
                    <p className="text-xs text-ink-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center text-center">
              <Activity className="w-8 h-8 text-ink-300 mb-2" />
              <p className="text-sm text-ink-500">No recent activities</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
