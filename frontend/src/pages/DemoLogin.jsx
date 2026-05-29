import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, User, Lock, ArrowRight, Sparkles, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DemoLogin = () => {
  const navigate = useNavigate();
  const { demoLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const demoUsers = [
    { role: 'Admin', username: 'admin_demo', password: 'demo123', description: 'Full system access, manage users & settings' },
    { role: 'Supervisor', username: 'supervisor_demo', password: 'demo123', description: 'Manage staff, approve stock movements' },
    { role: 'Staff', username: 'staff_demo', password: 'demo123', description: 'Daily operations, record stock & health' },
    { role: 'Auditor', username: 'auditor_demo', password: 'demo123', description: 'View-only access to reports & logs' },
  ];

  const handleDemoLogin = async (username, password) => {
    setIsLoading(true);
    try {
      // Simulate API call with demo credentials
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create demo user object based on role
      const demoUser = demoUsers.find(u => u.username === username);
      if (!demoUser) throw new Error('Invalid demo credentials');
      
      // Mock login with demo data
      const mockUser = {
        user_id: 999,
        username: username,
        email: `${username}@demo.growventory.com`,
        full_name: `Demo ${demoUser.role}`,
        role_id: demoUsers.indexOf(demoUser) + 1,
        role_name: demoUser.role.toLowerCase(),
        is_active: 1,
        token: 'demo_token_' + Date.now(),
      };
      
      // Use demoLogin function from AuthContext
      demoLogin(mockUser);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Demo login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col px-6 sm:px-12 lg:px-16 xl:px-24 py-8 relative">
        {/* Top nav */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-forest-700 rounded-xl flex items-center justify-center group-hover:bg-forest-800 transition-colors">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight">Growventory</span>
          </Link>
          <Link to="/" className="hidden sm:flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back home
          </Link>
        </div>

        {/* Form */}
        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto py-12">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full mb-4">
              <Sparkles className="w-3 h-3" />
              Demo Mode
            </span>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Try Growventory Demo</h1>
            <p className="mt-3 text-gray-500">
              Experience the full system with pre-filled demo data. No backend required.
            </p>
          </div>

          {/* Demo Users */}
          <div className="space-y-4 mb-8">
            {demoUsers.map((user) => (
              <div key={user.role} className="p-4 border border-ink-100 rounded-xl hover:border-forest-200 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-ink-900">{user.role}</h3>
                    <p className="text-sm text-ink-500 mt-0.5">{user.description}</p>
                  </div>
                  <button
                    onClick={() => handleDemoLogin(user.username, user.password)}
                    disabled={isLoading}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    {isLoading ? 'Loading...' : 'Try as ' + user.role}
                  </button>
                </div>
                <div className="mt-3 text-xs text-ink-400">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    <code className="bg-ink-50 px-2 py-0.5 rounded">{user.username}</code>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Lock className="w-3 h-3" />
                    <code className="bg-ink-50 px-2 py-0.5 rounded">{user.password}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Demo Features */}
          <div className="bg-forest-50 border border-forest-100 rounded-xl p-5">
            <h3 className="font-bold text-forest-900 mb-3">Demo Features</h3>
            <div className="space-y-2">
              {[
                'Full navigation with role-based sidebar',
                'Pre-filled plants, stock, health data',
                'Interactive tables & charts',
                'Notifications & activity logs',
                'Settings page with toggles',
                'User management interface',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-forest-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-forest-600" />
                  </div>
                  <span className="text-sm text-forest-800">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="mt-8 pt-6 border-t border-ink-100">
            <p className="text-center text-gray-500">
              Need the real system?{' '}
              <Link to="/login" className="text-forest-700 hover:text-forest-800 font-semibold transition-colors">
                Go to actual login
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} Growventory Demo. All data is simulated.
        </p>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900"></div>
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-purple-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-indigo-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]"></div>

        <div className="relative z-10 flex flex-col justify-center w-full p-12 xl:p-20">
          <div className="max-w-md">
            <div className="mb-12">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Demo Mode Active</p>
                    <p className="text-purple-200 text-xs">All features available</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-100 text-sm">Plants Catalogue</span>
                    <span className="text-purple-300 text-sm font-semibold">24 species</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-100 text-sm">Stock Movements</span>
                    <span className="text-purple-300 text-sm font-semibold">142 records</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-100 text-sm">Health Checks</span>
                    <span className="text-amber-300 text-sm font-semibold">3 alerts</span>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
              Experience the full system,<br />
              <span className="text-purple-200">without setup.</span>
            </h2>
            <p className="mt-6 text-lg text-purple-100 leading-relaxed">
              Perfect for client demos, presentations, and testing all frontend features instantly.
            </p>

            <div className="mt-10 space-y-3">
              {[
                'No database or backend required',
                'Pre-populated with realistic data',
                'All roles available to test',
                'Interactive components work',
                'Persists during session',
                'Easy to reset',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-purple-300" />
                  </div>
                  <span className="text-purple-50">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoLogin;