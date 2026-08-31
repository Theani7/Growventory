import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, ArrowRight, Loader2, AlertCircle, Clock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [verifyEmail, setVerifyEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    setVerifyEmail('');
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(formData.username, formData.password);
      if (result.success) navigate('/dashboard');
      else setError(result.message || 'Login failed');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid username or password';
      const code = err.response?.data?.code || '';
      setError(msg);
      setErrorCode(code);
      if (code === 'EMAIL_NOT_VERIFIED') {
        const emailFromResp = err.response?.data?.data?.email || formData.username;
        setVerifyEmail(emailFromResp);
        localStorage.setItem('pendingVerificationEmail', emailFromResp);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!verifyEmail) return;
    setIsResending(true);
    try {
      const { data } = await api.post('/auth/send-verification-otp', { email: verifyEmail });
      toast.success(data.message || 'Verification code sent');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const isPending = errorCode === 'PENDING_APPROVAL';
  const isDisabled = errorCode === 'ACCOUNT_DISABLED';
  const isNeedVerify = errorCode === 'EMAIL_NOT_VERIFIED';

  return (
    <div className="min-h-screen bg-[#fcfdfc] flex flex-col lg:flex-row">
      {/* Left — Form */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="h-[72px] flex items-center justify-between px-6 sm:px-10 lg:px-12 border-b border-stone-100 bg-white/80 backdrop-blur">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Growventory" className="w-9 h-9 object-contain" />
            <span className="font-bold text-[16px] tracking-tight text-stone-900">Growventory</span>
          </Link>
          <Link to="/" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900">
            ← Back home
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-12 py-10">
          <div className="w-full max-w-[420px]">
            <div className="mb-8">
              <h1 className="text-[32px] font-bold tracking-tight text-stone-900 leading-none">Welcome back</h1>
              <p className="mt-2 text-sm text-stone-600">
                New to Growventory?{' '}
                <Link to="/register" className="font-semibold text-[#1d4d2e] hover:underline">
                  Create an account
                </Link>
              </p>
            </div>

            {error && (
              <div className="mb-5">
                {isNeedVerify ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-amber-700" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900">Verify your email</p>
                        <p className="text-sm text-amber-800/80 mt-1 leading-relaxed">{error}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button onClick={() => navigate(`/verify-email?email=${encodeURIComponent(verifyEmail)}`)} className="py-2.5 rounded-full bg-[#1a3a2a] text-white text-sm font-semibold hover:bg-[#143021]">
                        Enter code
                      </button>
                      <button onClick={handleResendVerification} disabled={isResending} className="py-2.5 rounded-full bg-white border border-amber-200 text-amber-800 text-sm font-semibold hover:bg-amber-50 disabled:opacity-50 flex items-center justify-center gap-1">
                        {isResending ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Resend
                      </button>
                    </div>
                  </div>
                ) : isPending ? (
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-stone-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">Awaiting approval</p>
                      <p className="text-sm text-stone-600 mt-1">{error}</p>
                    </div>
                  </div>
                ) : isDisabled ? (
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-stone-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">Account disabled</p>
                      <p className="text-sm text-stone-600 mt-1">{error}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-red-200 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-red-900">Login failed</p>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[13px] font-medium text-stone-700">Username or email</label>
                <div className="mt-1.5 relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => { setFormData({ ...formData, username: e.target.value }); setError(''); }}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1d4d2e]/20 focus:border-[#1d4d2e] transition"
                    placeholder="you@example.com"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[13px] font-medium text-stone-700">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-[#1d4d2e] hover:underline">Forgot password?</Link>
                </div>
                <div className="mt-1.5 relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError(''); }}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#1d4d2e]/20 focus:border-[#1d4d2e] transition"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3.5 bg-[#1a3a2a] text-white font-semibold rounded-full hover:bg-[#143021] transition-all shadow-md shadow-[#1a3a2a]/20 hover:shadow-lg disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs text-stone-500 pt-2">
                Protected by Growventory • Encrypted & role-based
              </p>
            </form>
          </div>
        </div>

        <p className="hidden lg:block text-center text-xs text-stone-400 pb-6">© {new Date().getFullYear()} Growventory</p>
      </div>

      {/* Right — Image */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-stone-900">
        <img src="/hero-greenhouse.png" alt="Greenhouse interior with plants on benches" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        <div className="absolute inset-0 bg-[#1a3a2a]/20 mix-blend-multiply" />
        {/* Bottom card */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-white/95 backdrop-blur rounded-2xl border border-white/20 p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <img src="/logo.png" alt="" className="w-8 h-8 object-contain" />
              <div>
                <p className="text-sm font-semibold text-stone-900 leading-none">Growventory</p>
                <p className="text-xs text-stone-500">Calm inventory, live health</p>
              </div>
              <span className="ml-auto text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">Live</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-stone-50 border border-stone-100 py-3">
                <div className="text-lg font-bold text-stone-900">342</div>
                <div className="text-[11px] font-medium tracking-wide uppercase text-stone-500">Plants</div>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 py-3">
                <div className="text-lg font-bold text-emerald-800">98%</div>
                <div className="text-[11px] font-medium tracking-wide uppercase text-emerald-700">Healthy</div>
              </div>
              <div className="rounded-xl bg-stone-50 border border-stone-100 py-3">
                <div className="text-lg font-bold text-stone-900">+18</div>
                <div className="text-[11px] font-medium tracking-wide uppercase text-stone-500">Today</div>
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-white/70">Trusted by nursery teams • Real-time • Cloud sync</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
