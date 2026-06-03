import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Phone, ChevronLeft, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirm_password: '',
    full_name: '', phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null); // null | { pending: bool, username }
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone || null,
          // role_id intentionally omitted — assigned by admin on approval
        }),
      });
      const data = await response.json();
      if (data.success) {
        const isPending = data.data?.pending !== false;
        if (isPending) {
          setSubmitted({ pending: true, username: formData.username });
        } else {
          toast.success('Account created. You can sign in now.');
          navigate('/login');
        }
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return { level: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const levels = [
      { label: 'Weak', color: 'bg-red-500' },
      { label: 'Fair', color: 'bg-amber-500' },
      { label: 'Good', color: 'bg-blue-500' },
      { label: 'Strong', color: 'bg-emerald-500' },
      { label: 'Excellent', color: 'bg-forest-600' },
    ];
    return { level: score, ...levels[Math.min(score - 1, 4)] };
  };
  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-white flex">
      {/* Pending approval success screen */}
      {submitted?.pending && (
        <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-forest-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-1 ring-forest-200">
              <Clock className="w-10 h-10 text-forest-700" strokeWidth={2} />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-forest-50 text-forest-700 text-xs font-semibold rounded-full mb-4">
              <Sparkles className="w-3 h-3" />
              Almost there
            </span>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Awaiting approval</h1>
            <p className="mt-3 text-gray-600 leading-relaxed">
              Thanks for registering, <span className="font-semibold text-gray-900">{submitted.username}</span>. An administrator will review your account and assign you a role shortly.
            </p>
            <div className="mt-6 p-4 bg-gray-50 rounded-2xl text-left">
              <h3 className="text-sm font-bold text-gray-900 mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0 mt-0.5" />
                  <span>An admin gets notified about your registration</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0 mt-0.5" />
                  <span>They review and assign you a role (staff, supervisor, or auditor)</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest-600 flex-shrink-0 mt-0.5" />
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
            <p className="mt-4 text-xs text-gray-500">
              Need access faster? Contact your administrator directly.
            </p>
          </div>
        </div>
      )}

      {/* Left side - Visual */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-forest-700 via-forest-800 to-forest-900"></div>
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-forest-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]"></div>

        <div className="relative z-10 flex flex-col justify-center w-full p-12 xl:p-20">
          <div className="max-w-md">
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
              Create your account.
            </h2>
            <p className="mt-6 text-lg text-forest-100 leading-relaxed">
              Join Growventory and start managing your nursery in minutes.
            </p>

            <div className="mt-10 space-y-4">
              {[
                { title: 'Track unlimited plants', desc: 'Add as many plants as you need with rich details' },
                { title: 'Real-time monitoring', desc: 'Get instant alerts for low stock and health issues' },
                { title: 'Beautiful reports', desc: 'Export data and analyze trends in seconds' },
                { title: 'Team collaboration', desc: 'Role-based access for admins, staff, and auditors' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{item.title}</p>
                    <p className="text-forest-200 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col px-6 sm:px-12 lg:px-12 xl:px-20 py-8 overflow-y-auto">
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
        <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto py-8">
          <div className="mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-forest-50 text-forest-700 text-xs font-semibold rounded-full mb-4">
              <Sparkles className="w-3 h-3" />
              Get started
            </span>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Create your account</h1>
            <p className="mt-3 text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-forest-700 hover:text-forest-800 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Username *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text" required
                    className="input-field pl-10"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="label">Full name *</label>
                <input
                  type="text" required
                  className="input-field"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" required
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  className="input-field pl-10"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'} required
                  className="input-field pl-10 pr-10"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center gap-1.5">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < strength.level ? strength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password strength: <span className="font-medium">{strength.label}</span></p>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password" required
                  className="input-field pl-10"
                  placeholder="Re-enter password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-forest-700 hover:underline">Terms</a> and{' '}
              <a href="#" className="text-forest-700 hover:underline">Privacy Policy</a>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base shadow-lg shadow-forest-700/20 hover:shadow-forest-700/30 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
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
    </div>
  );
};

export default Register;
