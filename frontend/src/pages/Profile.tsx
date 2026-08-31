import { useEffect, useState } from 'react';
import { User, Mail, Phone, Shield, Lock, Save, Loader2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

type ProfileData = {
  user_id: number;
  username: string;
  email: string;
  full_name?: string;
  phone?: string;
  role_name?: string;
  is_email_verified?: boolean;
  created_at?: string;
};

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '' });
  const [pwd, setPwd] = useState({ current_password: '', new_password: '', confirm: '' });

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/users/me');
      const p = data.data as ProfileData;
      setProfile(p);
      setForm({ full_name: p.full_name || '', phone: p.phone || '' });
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      toast.error('Full name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.put('/users/me', { full_name: form.full_name.trim(), phone: form.phone.trim() || null });
      setProfile(data.data);
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async () => {
    if (!pwd.current_password || !pwd.new_password) {
      toast.error('Fill current and new password');
      return;
    }
    if (pwd.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (pwd.new_password !== pwd.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setChanging(true);
    try {
      await api.patch('/users/me/password', { current_password: pwd.current_password, new_password: pwd.new_password });
      toast.success('Password changed');
      setPwd({ current_password: '', new_password: '', confirm: '' });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-200 border-t-[#1a3a2a]" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-stone-400">Account</p>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 mt-1">Profile</h1>
        <p className="text-sm text-stone-500 mt-1">Manage your personal information and password. Visible to all roles.</p>
      </div>

      {/* Header card */}
      <div className="card p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1a3a2a] to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
          {profile?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-stone-900">{profile?.username}</p>
          <p className="text-sm text-stone-500 truncate">{profile?.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 ring-1 ring-stone-200 capitalize">
              <Shield className="w-3 h-3" /> {profile?.role_name || user?.role_name}
            </span>
            {profile?.is_email_verified ? (
              <span className="text-xs text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2 py-0.5 rounded-full">Verified</span>
            ) : (
              <span className="text-xs text-amber-700 bg-amber-50 ring-1 ring-amber-200 px-2 py-0.5 rounded-full">Unverified</span>
            )}
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-stone-100">
          <div className="w-10 h-10 rounded-xl bg-[#eef6ee] border border-[#d6ead6] flex items-center justify-center">
            <User className="w-5 h-5 text-[#1d4d2e]" />
          </div>
          <div>
            <h2 className="font-bold text-stone-900">Personal information</h2>
            <p className="text-sm text-stone-500">Update your display name and contact</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input value={profile?.username || ''} disabled className="input-field pl-10 bg-stone-50 text-stone-500" />
              </div>
              <p className="text-xs text-stone-400 mt-1">Cannot be changed</p>
            </div>
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input value={profile?.email || ''} disabled className="input-field pl-10 bg-stone-50 text-stone-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Full name *</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Jane Doe"
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="label">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+977-..."
                className="input-field pl-10"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleSave} disabled={saving} className="btn-primary px-6">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-stone-100">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h2 className="font-bold text-stone-900">Change password</h2>
            <p className="text-sm text-stone-500">Keep your account secure</p>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <div>
            <label className="label">Current password *</label>
            <input
              type="password"
              value={pwd.current_password}
              onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })}
              placeholder="Enter current password"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">New password *</label>
            <input
              type="password"
              value={pwd.new_password}
              onChange={(e) => setPwd({ ...pwd, new_password: e.target.value })}
              placeholder="Min. 6 characters"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Confirm new password *</label>
            <input
              type="password"
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
              placeholder="Re-enter new password"
              className="input-field"
            />
          </div>
          <div className="flex justify-end">
            <button onClick={handlePassword} disabled={changing} className="btn-primary px-6">
              {changing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {changing ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
