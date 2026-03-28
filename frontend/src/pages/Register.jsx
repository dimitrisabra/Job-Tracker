import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Spinner } from '../components/common/LoadingScreen';
import SiteCredit from '../components/common/SiteCredit';
import ThemeToggle from '../components/common/ThemeToggle';

export default function Register() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) return toast.error('Please fill in all fields');
    if (form.name.length < 2) return toast.error('Name must be at least 2 characters');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (form.password !== form.confirm) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      toast.success('Account created! Welcome aboard 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return null;
    if (p.length < 6) return { label: 'Too short', color: 'bg-red-500', width: '25%' };
    if (p.length < 8) return { label: 'Weak', color: 'bg-amber-500', width: '50%' };
    if (!/[A-Z]/.test(p) || !/[0-9]/.test(p)) return { label: 'Medium', color: 'bg-yellow-500', width: '75%' };
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' };
  })();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="fixed top-4 right-4 z-20">
        <ThemeToggle compact />
      </div>

      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">JT</div>
          <span className="text-white font-bold">JobTracker</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
        <p className="text-slate-400 text-sm mb-8">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
        </p>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                className="input" placeholder="Alex Johnson" autoComplete="name" required />
            </div>

            <div>
              <label className="label">Email address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="input" placeholder="you@example.com" autoComplete="email" required />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  className="input pr-10" placeholder="Min. 6 characters" autoComplete="new-password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {strength && (
                <div className="mt-2">
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{strength.label}</p>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm password</label>
              <input type="password" name="confirm" value={form.confirm} onChange={handleChange}
                className="input" placeholder="Repeat your password" autoComplete="new-password" required />
              {form.confirm && form.password !== form.confirm && (
                <p className="text-xs text-red-400 mt-1">Passwords don't match</p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2">
              {loading ? <><Spinner size="sm" /> Creating account…</> : 'Create account →'}
            </button>
          </form>

          <p className="text-xs text-slate-600 text-center mt-4">
            By signing up, you agree to our Terms and Privacy Policy.
          </p>
        </div>

        <SiteCredit className="text-center mt-8" />
      </div>
    </div>
  );
}
