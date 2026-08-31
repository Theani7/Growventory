import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Phone, AtSign, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirm_password: '', full_name: '', phone: '', requested_role: 'staff',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const navigate = useNavigate();

  const validatePhone = (v: string) => {
    if (!v.trim()) return '';
    const digits = v.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return 'Phone must be 10-15 digits';
    if (!/^\+?[\d\s\-\(\)]+$/.test(v)) return 'Use digits, spaces, dashes, () and + only';
    return '';
  };

  const isStrongPassword = (p: string) =>
    p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p) && /[^A-Za-z0-9]/.test(p);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const pe = validatePhone(formData.phone);
    if (pe) {
      setPhoneError(pe);
      toast.error(pe);
      return;
    }
    if (!isStrongPassword(formData.password)) {
      toast.error('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        phone: formData.phone || null,
        requested_role: formData.requested_role,
      });
      if (data.success) {
        const email = formData.email;
        localStorage.setItem('pendingVerificationEmail', email);
        toast.success('Account created. Check your email for a 4-digit code.');
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return { level: 0, label: '', color: '' };
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    const levels = [
      { label: 'Weak', color: 'bg-red-500' },
      { label: 'Fair', color: 'bg-amber-500' },
      { label: 'Good', color: 'bg-blue-500' },
      { label: 'Strong', color: 'bg-emerald-500' },
      { label: 'Excellent', color: 'bg-[#1a3a2a]' },
    ];
    return { level: score, ...levels[Math.min(score, 4)] };
  };
  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-[#fcfdfc] flex flex-col lg:flex-row">
      {/* Left Image (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-stone-900">
        <img src="/feature-inventory.png" alt="Six potted plants with QR tags and inventory clipboard on wood table" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        <div className="absolute inset-0 bg-[#1a3a2a]/10 mix-blend-multiply" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-white/95 backdrop-blur rounded-2xl border border-white/20 p-5 shadow-xl">
            <p className="text-sm font-semibold text-stone-900">Inventory you can trust</p>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">Every plant tagged, counted and tracked from potting to sale. QR tags and CSV import make it effortless.</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-stone-50 border border-stone-100 py-2">
                <div className="text-sm font-bold text-stone-900">QR Tag</div>
                <div className="text-[11px] text-stone-500">Scan</div>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-100 py-2">
                <div className="text-sm font-bold text-emerald-800">CSV</div>
                <div className="text-[11px] text-emerald-700">Bulk add</div>
              </div>
              <div className="rounded-xl bg-stone-50 border border-stone-100 py-2">
                <div className="text-sm font-bold text-stone-900">Live</div>
                <div className="text-[11px] text-stone-500">Sync</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex flex-col min-h-screen">
        <div className="h-[72px] flex items-center justify-between px-6 sm:px-10 lg:px-12 border-b border-stone-100 bg-white/80 backdrop-blur">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Growventory" className="w-9 h-9 object-contain" />
            <span className="font-bold text-[16px] tracking-tight text-stone-900">Growventory</span>
          </Link>
          <Link to="/" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900">← Back home</Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 lg:px-12 py-8">
          <div className="w-full max-w-[460px]">
            <div className="mb-6">
              <h1 className="text-[32px] font-bold tracking-tight text-stone-900 leading-none">Create your account</h1>
              <p className="mt-2 text-sm text-stone-600">
                Already have an account? <Link to="/login" className="font-semibold text-[#1d4d2e] hover:underline">Sign in</Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[13px] font-medium text-stone-700">Full name *</label>
                <div className="mt-1.5 relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input type="text" required className="w-full pl-10 pr-3 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4d2e]/20 focus:border-[#1d4d2e]" placeholder="Jane Doe" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-stone-700">Username *</label>
                <div className="mt-1.5 relative">
                  <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input type="text" required className="w-full pl-10 pr-3 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4d2e]/20 focus:border-[#1d4d2e]" placeholder="janedoe" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-stone-700">Email *</label>
                <div className="mt-1.5 relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input type="email" required className="w-full pl-10 pr-3 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4d2e]/20 focus:border-[#1d4d2e]" placeholder="you@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium text-stone-700">Requested role *</label>
                <div className="mt-1.5 relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  <select
                    value={formData.requested_role}
                    onChange={(e) => setFormData({ ...formData, requested_role: e.target.value })}
                    className="w-full pl-10 pr-10 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#1d4d2e]/20 focus:border-[#1d4d2e] appearance-none"
                  >
                    <option value="staff">Staff: Daily operations</option>
                    <option value="supervisor">Supervisor: Manage staff and approvals</option>
                    <option value="auditor">Auditor: Read-only reports</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">▾</div>
                </div>
                <p className="mt-1 text-xs text-stone-500">Admin will review and confirm your role</p>
              </div>

              <div>
                <label className="text-[13px] font-medium text-stone-700">Phone <span className="font-normal text-stone-400">(optional)</span></label>
                <div className="mt-1.5 relative">
                  <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${phoneError ? 'text-red-400' : 'text-stone-400'}`} />
                  <input
                    type="tel"
                    inputMode="tel"
                    maxLength={20}
                    className={`w-full pl-10 pr-3 py-3 bg-white border rounded-xl text-sm focus:outline-none focus:ring-2 transition ${phoneError ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : 'border-stone-200 focus:border-[#1d4d2e] focus:ring-[#1d4d2e]/20'}`}
                    placeholder="+977 98XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => {
                      const v = e.target.value;
                      // allow only +, digits, spaces, dashes, parentheses
                      if (/^[\d\s\-\(\)\+]*$/.test(v) || v === '') {
                        setFormData({ ...formData, phone: v });
                        if (phoneError) setPhoneError(validatePhone(v));
                      }
                    }}
                    onBlur={() => setPhoneError(validatePhone(formData.phone))}
                  />
                </div>
                {phoneError ? (
                  <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                ) : (
                  <p className="mt-1 text-xs text-stone-500">10-15 digits, may include +, spaces or dashes</p>
                )}
              </div>

              <div>
                <label className="text-[13px] font-medium text-stone-700">Password *</label>
                <div className="mt-1.5 relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input type={showPassword ? 'text' : 'password'} required className="w-full pl-10 pr-10 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4d2e]/20 focus:border-[#1d4d2e]" placeholder="Min. 8 characters" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-stone-500">Password must be at least 8 characters and include uppercase, lowercase, number, and special character.</p>
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex gap-1.5">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full ${i < strength.level ? strength.color : 'bg-stone-200'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-stone-500 mt-1">Strength: <span className="font-medium">{strength.label}</span></p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[13px] font-medium text-stone-700">Confirm password *</label>
                <div className="mt-1.5 relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input type="password" required className="w-full pl-10 pr-3 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4d2e]/20 focus:border-[#1d4d2e]" placeholder="Re-enter password" value={formData.confirm_password} onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })} />
                </div>
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                By creating an account, you agree to our <a href="#" className="font-medium text-[#1d4d2e] hover:underline">Terms</a> and <a href="#" className="font-medium text-[#1d4d2e] hover:underline">Privacy Policy</a>.
              </p>

              <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-[#1a3a2a] text-white font-semibold rounded-full hover:bg-[#143021] transition-all shadow-md shadow-[#1a3a2a]/20 hover:shadow-lg disabled:opacity-60">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : <>Create account <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-stone-400 pb-6 hidden lg:block">© {new Date().getFullYear()} Growventory</p>
      </div>
    </div>
  );
};

export default Register;
