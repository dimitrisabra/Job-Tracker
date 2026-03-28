import { NavLink, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ThemeToggle from '../common/ThemeToggle';
import { useAuth } from '../../context/AuthContext';

const NavItem = ({ to, icon, label, end = false, badge }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
        isActive ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`
    }
  >
    <span className="text-lg leading-none">{icon}</span>
    <span className="flex-1">{label}</span>
    {badge && <span className="text-xs bg-brand-600 text-white px-1.5 py-0.5 rounded-md">{badge}</span>}
  </NavLink>
);

export default function Sidebar({ onClose }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/');
    onClose?.();
  };

  const initials = user?.name?.split(' ').map((name) => name[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <aside className="flex flex-col h-full w-64 bg-slate-900 border-r border-slate-800">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">JT</div>
        <div>
          <h1 className="text-sm font-bold text-white leading-none">JobTracker</h1>
          <p className="text-xs text-slate-500 mt-0.5">Career Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">Discover</p>
        <NavItem to="/" icon="🌐" label="Job Board" end />

        <div className="my-2 border-t border-slate-800" />
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">My Career</p>
        <NavItem to="/dashboard" icon="📊" label="Dashboard" end />
        <NavItem to="/jobs" icon="💼" label="My Applications" />
        <NavItem to="/activity" icon="📋" label="Activity Log" />
        <NavItem to="/profile" icon="👤" label="Profile" />

        {isAdmin && (
          <>
            <div className="my-2 border-t border-slate-800" />
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">Admin</p>
            <NavItem to="/admin" icon="⚡" label="Admin Dashboard" end />
            <NavItem to="/admin/users" icon="👥" label="Manage Users" />
            <NavItem to="/admin/postings" icon="📌" label="Job Postings" />
            <NavItem to="/admin/jobs" icon="🗂️" label="All Applications" />
          </>
        )}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <ThemeToggle className="w-full justify-center mb-3" />

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/50 mb-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          {isAdmin && (
            <span className="text-xs bg-brand-600/20 text-brand-400 px-1.5 py-0.5 rounded-md font-medium flex-shrink-0">Admin</span>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <span>🚪</span>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
