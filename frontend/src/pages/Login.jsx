import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Spinner } from '../components/common/LoadingScreen';
import SiteCredit from '../components/common/SiteCredit';
import ThemeToggle from '../components/common/ThemeToggle';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');

    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => {
    setForm({ email, password });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle compact />
      </div>

      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 via-brand-900/20 to-slate-900 flex-col justify-between p-12 border-r border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold">
            JT
          </div>
          <span className="text-white font-bold text-lg">JobTracker</span>
        </div>

        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Track every opportunity,<br />
            <span className="text-gradient">land your dream job.</span>
          </h2>
          <p className="text-slate-400 text-lg">
            Manage applications, track statuses, and get AI-powered insights — all in one place.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { icon: '📊', label: 'Visual Dashboard', desc: 'See all stats at a glance' },
              { icon: '🔔', label: 'Status Alerts', desc: 'Email notifications on updates' },
              { icon: '🤖', label: 'AI Suggestions', desc: 'Improve your notes with AI' },
              { icon: '📱', label: 'Mobile Ready', desc: 'Works on any device' },
            ].map((f) => (
              <div key={f.label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="text-2xl mb-2">{f.icon}</div>
                <p className="text-sm font-semibold text-white">{f.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-sm">© 2024 JobTracker. All rights reserved.</p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">JT</div>
            <span className="text-white font-bold">JobTracker</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">Sign in</h1>
          <p className="text-slate-400 text-sm mb-8">Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">Create one free</Link>
          </p>

          {/* Demo credentials */}
          <div className="mb-6 p-4 bg-slate-800/60 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">Demo accounts</p>
            <div className="flex gap-2">
              <button
                onClick={() => fillDemo('alex@example.com', 'password123')}
                className="flex-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg transition-colors"
              >
                👤 User Demo
              </button>
              <button
                onClick={() => fillDemo('admin@jobtracker.com', 'Admin123!')}
                className="flex-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-2 rounded-lg transition-colors"
              >
                ⚡ Admin Demo
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className="input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
            >
              {loading ? <><Spinner size="sm" /> Signing in…</> : 'Sign in →'}
            </button>
          </form>

          <SiteCredit className="text-center mt-8" />
        </div>
      </div>
    </div>
  );
}
