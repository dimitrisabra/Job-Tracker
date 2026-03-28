import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Spinner } from '../components/common/LoadingScreen';
import { format } from 'date-fns';

export default function Profile() {
  const { user, updateUser } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return toast.error('Name is required');
    setProfileLoading(true);
    try {
      const { data } = await userAPI.updateProfile(profileForm);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) return toast.error('All fields are required');
    if (passwordForm.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return toast.error('Passwords do not match');
    setPasswordLoading(true);
    try {
      await userAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account details and security</p>
      </div>

      {/* Avatar + account info */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border-2 border-brand-500/30 flex items-center justify-center text-brand-400 text-xl font-bold flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-lg font-semibold text-white">{user?.name}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
              user?.role === 'admin' ? 'bg-brand-600/20 text-brand-400' : 'bg-slate-700 text-slate-400'
            }`}>
              {user?.role === 'admin' ? '⚡ Admin' : '👤 User'}
            </span>
            {user?.createdAt && (
              <span className="text-xs text-slate-600">
                Joined {format(new Date(user.createdAt), 'MMM yyyy')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile form */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4">Personal Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              className="input"
              placeholder="Your full name"
              required
            />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              className="input"
              placeholder="your@email.com"
              required
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={profileLoading} className="btn-primary">
              {profileLoading ? <><Spinner size="sm" />Saving…</> : '✓ Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password form */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="input pr-10"
                placeholder="Enter current password"
              />
              <button type="button" onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPasswords ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="input"
              placeholder="Min. 6 characters"
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="input"
              placeholder="Repeat new password"
            />
            {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
              <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
            )}
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={passwordLoading} className="btn-primary">
              {passwordLoading ? <><Spinner size="sm" />Updating…</> : '🔒 Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Account meta */}
      <div className="card">
        <h2 className="text-sm font-semibold text-white mb-4">Account Details</h2>
        <div className="space-y-3">
          {[
            { label: 'Account ID', value: user?._id, mono: true },
            { label: 'Role', value: user?.role === 'admin' ? 'Administrator' : 'Standard User' },
            { label: 'Account Status', value: user?.status === 'active' ? '✅ Active' : '🚫 Suspended' },
            { label: 'Last Login', value: user?.lastLogin ? format(new Date(user.lastLogin), 'MMM d, yyyy · h:mm a') : 'N/A' },
            { label: 'Member Since', value: user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : 'N/A' },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-800 last:border-0">
              <span className="text-sm text-slate-500">{label}</span>
              <span className={`text-sm text-slate-300 text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
