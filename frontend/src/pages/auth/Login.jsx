import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff, User, Lock, ArrowRight, Loader2, ChevronLeft, Sparkles, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    
    const trimmedUsername = formData.username.trim();

    if (!trimmedUsername || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await login(trimmedUsername, formData.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
      setErrorCode(err.response?.data?.code || '');
    } finally {
      setIsLoading(false);
    }
  };

  const isPending = errorCode === 'PENDING_APPROVAL';
  const isDisabled = errorCode === 'ACCOUNT_DISABLED';

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col px-6 sm:px-12 lg:px-16 xl:px-24 py-8 relative">
        {/* Top nav */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="Growventory Logo" className="w-12 h-12 object-contain" />
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-forest-50 text-forest-700 text-xs font-semibold rounded-full mb-4">
              <Sparkles className="w-3 h-3" />
              Welcome back
            </span>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Sign in to your account</h1>
            <p className="mt-3 text-gray-500">
              New to Growventory?{' '}
              <Link to="/register" className="text-forest-700 hover:text-forest-800 font-semibold transition-colors">
                Create an account
              </Link>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            isPending ? (
              <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-amber-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">Awaiting Approval</p>
                  <p className="text-sm text-amber-800 mt-0.5">{error}</p>
                </div>
              </div>
            ) : isDisabled ? (
              <div className="mb-5 p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-gray-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Account Disabled</p>
                  <p className="text-sm text-gray-600 mt-0.5">{error}</p>
                </div>
              </div>
            ) : (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-800">Login Failed</p>
                  <p className="text-sm text-red-600 mt-0.5">{error}</p>
                </div>
              </div>
            )
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="label">Username or email</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-forest-700 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => { setFormData({ ...formData, username: e.target.value }); setError(''); }}
                  className="input-field pl-11 py-3 text-base"
                  placeholder="you@example.com"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-forest-700 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError(''); }}
                  className="input-field pl-11 pr-11 py-3 text-base"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-forest-700 focus:ring-forest-500" />
              <span className="text-sm text-gray-600">Remember me for 30 days</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 text-base shadow-lg shadow-forest-700/20 hover:shadow-forest-700/30 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center">
          © {new Date().getFullYear()} Growventory. All rights reserved.
        </p>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-forest-700 via-forest-800 to-forest-900"></div>
        
        {/* Animated blobs */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-emerald-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-forest-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center w-full p-12 xl:p-20">
          <div className="max-w-md">
            {/* Floating card mockup */}
            <div className="mb-12">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/logo.png" alt="Growventory Logo" className="w-12 h-12 object-contain" />
                  <div>
                    <p className="text-white font-semibold text-sm">Inventory Update</p>
                    <p className="text-forest-200 text-xs">2 minutes ago</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-forest-100 text-sm">Monstera Deliciosa</span>
                    <span className="text-emerald-300 text-sm font-semibold">+24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-forest-100 text-sm">Snake Plant</span>
                    <span className="text-emerald-300 text-sm font-semibold">+12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-forest-100 text-sm">Fiddle Leaf Fig</span>
                    <span className="text-amber-300 text-sm font-semibold">Low stock</span>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
              Manage your nursery,<br />
              <span className="text-forest-200">beautifully.</span>
            </h2>
            <p className="mt-6 text-lg text-forest-100 leading-relaxed">
              Sign in to manage your nursery inventory, track stock movements, and monitor plant health.
            </p>

            <div className="mt-10 space-y-3">
              {[
                'Real-time inventory tracking',
                'Smart health monitoring',
                'Beautiful analytics & reports',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  </div>
                  <span className="text-forest-50">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;