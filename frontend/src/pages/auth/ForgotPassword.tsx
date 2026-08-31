import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, ChevronLeft, Sparkles, CheckCircle2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import OTPInput from '../../components/OTPInput';

type Step = 'email' | 'otp' | 'reset';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success(data.message || 'If an account exists, a code was sent');
      setStep('otp');
      setCooldown(60);
      setOtp('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success(data.message || 'New code sent');
      setCooldown(60);
      setOtp('');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to resend';
      toast.error(msg);
      const m = msg.match(/(\d+)\s*s/);
      if (m) setCooldown(parseInt(m[1]));
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(otp)) {
      toast.error('Enter 4-digit code');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-reset-otp', { email: email.trim(), otp });
      if (data.success) {
        toast.success('Code verified — set your new password');
        setStep('reset');
      } else {
        toast.error(data.message || 'Invalid code');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { email: email.trim(), otp, newPassword });
      if (data.success) {
        toast.success('Password reset! You can now sign in');
        navigate('/login');
      } else {
        toast.error(data.message || 'Reset failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex flex-col px-6 sm:px-12 lg:px-16 xl:px-24 py-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="logo" className="w-12 h-12 object-contain" />
            <span className="font-bold text-lg text-gray-900">Growventory</span>
          </Link>
          <Link to="/login" className="hidden sm:flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
            <ChevronLeft className="w-4 h-4" /> Back to login
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto py-12">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {(['email', 'otp', 'reset'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === s ? 'bg-forest-700 text-white' : ['otp', 'reset'].indexOf(step) > ['email', 'otp', 'reset'].indexOf(s) - 1 && step !== s && (step === 'otp' && s === 'email' || step === 'reset') ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {['otp', 'reset'].indexOf(step) >= ['email', 'otp', 'reset'].indexOf(s) && step !== s ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 ${['otp', 'reset'].indexOf(step) >= i ? 'bg-emerald-500' : 'bg-gray-100'}`} />}
              </div>
            ))}
          </div>

          {step === 'email' && (
            <>
              <div className="mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-forest-50 text-forest-700 text-xs font-semibold rounded-full mb-4">
                  <Sparkles className="w-3 h-3" /> Forgot password
                </span>
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Reset your password</h1>
                <p className="mt-3 text-gray-500">Enter your email and we'll send a 4-digit reset code.</p>
              </div>
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="label">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="input-field pl-10" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base disabled:opacity-70">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending...</> : <>Send reset code <ArrowRight className="w-5 h-5" /></>}
                </button>
                <p className="text-center text-sm text-gray-500">Remembered? <Link to="/login" className="text-forest-700 font-semibold hover:underline">Sign in</Link></p>
              </form>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Enter reset code</h1>
                <p className="mt-2 text-gray-500">Code sent to <span className="font-semibold text-gray-900">{email}</span> • Valid 10 min</p>
              </div>
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <label className="label">4-digit code *</label>
                  <OTPInput value={otp} onChange={setOtp} length={4} disabled={loading} />
                  <p className="text-xs text-gray-500 text-center mt-3">Check spam folder • 10-minute expiry</p>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base disabled:opacity-70">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : <>Verify code <ArrowRight className="w-5 h-5" /></>}
                </button>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => setStep('email')} className="text-gray-500 hover:text-gray-900">Change email</button>
                  <button type="button" onClick={handleResend} disabled={resending || cooldown > 0} className="inline-flex items-center gap-1.5 text-forest-700 font-semibold disabled:opacity-50">
                    {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'reset' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Set new password</h1>
                <p className="mt-2 text-gray-500">Choose a strong password for <span className="font-semibold text-gray-900">{email}</span></p>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="label">New password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" className="input-field pl-10 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="input-field pl-10" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base disabled:opacity-70">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Resetting...</> : <>Reset password <ArrowRight className="w-5 h-5" /></>}
                </button>
                <p className="text-xs text-gray-500 text-center">Code: <span className="font-mono font-semibold tracking-widest">{otp || '••••'}</span> • Re-verify if code expires</p>
              </form>
            </>
          )}
        </div>
        <p className="text-xs text-gray-400 text-center">© {new Date().getFullYear()} Growventory</p>
      </div>

      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-forest-700 via-forest-800 to-forest-900"></div>
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-emerald-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-forest-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]"></div>
        <div className="relative z-10 flex flex-col justify-center w-full p-12 xl:p-20">
          <div className="max-w-md">
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight">Back in control.</h2>
            <p className="mt-4 text-forest-100">4-digit OTP via Gmail App Password — fast & secure.</p>
            <div className="mt-8 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
              <p className="text-forest-50 text-sm flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300 mt-0.5" /> Gmail SMTP with App Password, TLS 587</p>
              <p className="text-forest-200 text-xs mt-2">Codes are bcrypt-hashed, single-use, 10-minute expiry, 60s resend cooldown, 5 attempt limit.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
