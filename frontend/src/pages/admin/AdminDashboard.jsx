import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { adminAPI } from '../../services/api';
import { Spinner } from '../../components/common/LoadingScreen';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = { Applied: '#3b82f6', Interview: '#f59e0b', Offer: '#10b981', Rejected: '#ef4444' };

const StatCard = ({ label, value, sub, icon, accent }) => (
  <div className={`card border ${accent} hover:border-opacity-60 transition-colors`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-sm text-slate-400 mt-1">{label}</p>
        {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
      </div>
      <span className="text-2xl">{icon}</span>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm shadow-xl">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="font-semibold text-white">{p.value} {p.name}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.getStats(), adminAPI.getActivity()])
      .then(([statsRes, actRes]) => {
        setStats(statsRes.data);
        setActivity(actRes.data.slice(0, 15));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  const pieData = stats
    ? Object.entries(stats.jobs.byStatus).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Platform-wide overview and analytics</p>
        </div>
        <span className="text-xs bg-brand-600/20 text-brand-400 border border-brand-500/30 px-3 py-1.5 rounded-xl font-medium">
          ⚡ Admin Mode
        </span>
      </div>

      {/* User stats */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Users</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats?.users.total || 0} icon="👥" accent="border-slate-800" sub={`+${stats?.users.newThisMonth || 0} this month`} />
          <StatCard label="Active Users" value={stats?.users.active || 0} icon="✅" accent="border-emerald-500/20" />
          <StatCard label="Suspended" value={stats?.users.suspended || 0} icon="🚫" accent="border-red-500/20" />
          <StatCard label="New This Month" value={stats?.users.newThisMonth || 0} icon="🆕" accent="border-brand-500/20" />
        </div>
      </div>

      {/* Job stats */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Applications</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Applications" value={stats?.jobs.total || 0} icon="📋" accent="border-slate-800" sub={`+${stats?.jobs.newThisMonth || 0} this month`} />
          <StatCard label="In Interview" value={stats?.jobs.byStatus?.Interview || 0} icon="🎯" accent="border-amber-500/20" />
          <StatCard label="Offers Made" value={stats?.jobs.byStatus?.Offer || 0} icon="🎉" accent="border-emerald-500/20" />
          <StatCard label="Rejected" value={stats?.jobs.byStatus?.Rejected || 0} icon="❌" accent="border-red-500/20" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">User Growth (Last 6 Months)</h2>
            <Link to="/admin/users" className="text-xs text-brand-400 hover:text-brand-300">View users →</Link>
          </div>
          {stats?.userGrowth?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.userGrowth} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
                <Bar dataKey="users" fill="#6272f1" radius={[6, 6, 0, 0]} name="new users" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">No data yet</div>
          )}
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-white mb-4">Application Status Mix</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="42%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">No data</div>
          )}
          <div className="mt-2 grid grid-cols-2 gap-1">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[entry.name] }} />
                {entry.name}: {entry.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Recent Platform Activity</h2>
        </div>
        {activity.length > 0 ? (
          <div className="space-y-2">
            {activity.map((log) => (
              <div key={log._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/40 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                  {log.user?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">
                    <span className="font-medium text-white">{log.user?.name || 'Unknown'}</span>
                    {' — '}{log.description}
                  </p>
                </div>
                <p className="text-xs text-slate-600 flex-shrink-0">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 text-sm text-center py-6">No recent activity</p>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/admin/users" className="card hover:border-brand-500/30 transition-colors group cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors">Manage Users</p>
              <p className="text-xs text-slate-500">View, suspend, or delete user accounts</p>
            </div>
            <span className="ml-auto text-slate-600 group-hover:text-brand-400 transition-colors">→</span>
          </div>
        </Link>
        <Link to="/admin/jobs" className="card hover:border-brand-500/30 transition-colors group cursor-pointer">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗂️</span>
            <div>
              <p className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors">All Applications</p>
              <p className="text-xs text-slate-500">Browse all job applications in the system</p>
            </div>
            <span className="ml-auto text-slate-600 group-hover:text-brand-400 transition-colors">→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
