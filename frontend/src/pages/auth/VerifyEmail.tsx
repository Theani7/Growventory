import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, ChevronLeft, Sparkles, CheckCircle2, RefreshCw, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import OTPInput from '../../components/OTPInput';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialEmail = searchParams.get('email') || localStorage.getItem('pendingVerificationEmail') || '';
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verifiedResult, setVerifiedResult] = useState<{ pending: boolean; username: string } | null>(null);

  useEffect(() => {
    if (initialEmail) localStorage.setItem('pendingVerificationEmail', initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    if (!/^\d{4}$/.test(otp)) {
      toast.error('Please enter the 4-digit code');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-email', { email: email.trim(), otp });
      if (data.success) {
        localStorage.removeItem('pendingVerificationEmail');
        const pending = data.data?.pending ?? false;
        const username = data.data?.username || email;
        if (pending) {
          setVerifiedResult({ pending: true, username });
          toast.success('Email verified! Awaiting admin approval.');
        } else {
          toast.success('Email verified! You can now sign in.');
          navigate('/login', { state: { verifiedEmail: email } });
        }
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Enter your email to resend code');
      return;
    }
    if (cooldown > 0) return;
    setResending(true);
    try {
      const { data } = await api.post('/auth/send-verification-otp', { email: email.trim() });
      if (data.success) {
        toast.success('New code sent. Check your inbox and spam');
        setCooldown(60);
        setOtp('');
      } else {
        toast.error(data.message || 'Failed to resend');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to resend code';
      toast.error(msg);
      // If rate limited, set cooldown
      const m = msg.match(/(\d+)\s*s/);
      if (m) setCooldown(parseInt(m[1]));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Pending approval screen after verification */}
      {verifiedResult?.pending && (
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-forest-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-1 ring-forest-200">
              <Clock className="w-10 h-10 text-[#1d4d2e]" strokeWidth={2} />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#eef6ee] text-[#1d4d2e] text-xs font-semibold rounded-full mb-4">
              <Sparkles className="w-3 h-3" />
              Email verified
            </span>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Awaiting approval</h1>
            <p className="mt-3 text-stone-600 leading-relaxed">
              Thanks, <span className="font-semibold text-stone-900">{verifiedResult.username}</span>. Your email is verified. An administrator will review your account and assign you a role shortly.
            </p>
            <div className="mt-6 p-4 bg-stone-50 rounded-2xl text-left">
              <h3 className="text-sm font-bold text-stone-900 mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1d4d2e] flex-shrink-0 mt-0.5" />
                  <span>Your email is confirmed and secure</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1d4d2e] flex-shrink-0 mt-0.5" />
                  <span>An admin gets notified about your verified registration</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#1d4d2e] flex-shrink-0 mt-0.5" />
                  <span>You can sign in once your account is approved</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full mt-6 py-3.5 text-base"
            >
              Go to sign in
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="mt-4 text-xs text-stone-500">Need access faster? Contact your administrator directly.</p>
          </div>
        </div>
      )}
      {/* Left form */}
      <div className="flex-1 flex flex-col px-6 sm:px-12 lg:px-16 xl:px-24 py-8 relative">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="logo" className="w-12 h-12 object-contain" />
            <span className="font-bold text-lg text-stone-900">Growventory</span>
          </Link>
          <Link to="/login" className="hidden sm:flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900">
            <ChevronLeft className="w-4 h-4" /> Back to login
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto py-12">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#eef6ee] text-[#1d4d2e] text-xs font-semibold rounded-full mb-4">
              <Sparkles className="w-3 h-3" /> Email verification
            </span>
            <h1 className="text-4xl font-bold text-stone-900 tracking-tight">Check your email</h1>
            <p className="mt-3 text-stone-500">
              We sent a 4-digit code to your email. Enter it below to verify your account.
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="label">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">4-digit code *</label>
              <OTPInput value={otp} onChange={setOtp} length={4} disabled={loading} />
              <p className="text-xs text-stone-500 text-center mt-3">Code expires in 10 minutes • Check spam folder</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base shadow-lg shadow-forest-700/20 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  Verify email <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500">Didn't receive code?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                className="inline-flex items-center gap-1.5 text-[#1d4d2e] hover:text-[#1a3a2a] font-semibold disabled:opacity-50"
              >
                {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>

            <p className="text-xs text-stone-500 text-center">
              Already verified? <Link to="/login" className="text-[#1d4d2e] font-semibold hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
        <p className="text-xs text-stone-400 text-center">© {new Date().getFullYear()} Growventory</p>
      </div>

      {/* Right visual */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a3a2a] via-[#143021] to-[#0f1f14]"></div>
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-emerald-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-forest-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]"></div>
        <div className="relative z-10 flex flex-col justify-center w-full p-12 xl:p-20">
          <div className="max-w-md">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl mb-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Mail className="w-5 h-5 text-white" /></div>
                <div><p className="text-white font-semibold text-sm">Verify inbox</p><p className="text-white/70 text-xs">4-digit code sent</p></div>
              </div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex-1 h-10 bg-white/90 rounded-lg flex items-center justify-center font-bold text-stone-900">{i === 1 ? '•' : i === 0 ? '•' : i === 2 ? '•' : '•'}</div>
                ))}
              </div>
            </div>
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight">Secure your account.</h2>
            <p className="mt-4 text-white/80">One-time code protects your nursery data.</p>
            <div className="mt-6 flex items-center gap-3 text-forest-50 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" /> 10-minute expiry • Encrypted & single-use
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
