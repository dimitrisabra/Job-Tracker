import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { jobsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/common/LoadingScreen';
import StatusBadge from '../components/common/StatusBadge';
import { format, formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = { Applied: '#3b82f6', Interview: '#f59e0b', Offer: '#10b981', Rejected: '#ef4444', Withdrawn: '#64748b' };

const StatCard = ({ label, value, icon, sub, accent = 'border-slate-800', onClick }) => (
  <div onClick={onClick} className={`bg-slate-900 border ${accent} rounded-2xl p-5 ${onClick ? 'cursor-pointer hover:border-opacity-60' : ''} transition-colors`}>
    <div className="flex items-start justify-between mb-3">
      <span className="text-2xl">{icon}</span>
      {sub && <span className="text-xs text-slate-600 bg-slate-800 px-2 py-0.5 rounded-lg">{sub}</span>}
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    <p className="text-sm text-slate-400 mt-1">{label}</p>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm shadow-xl">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} className="font-semibold" style={{ color: p.color || p.fill }}>{p.value} {p.name}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, jobsRes, allRes] = await Promise.all([
          jobsAPI.getStats(),
          jobsAPI.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' }),
          jobsAPI.getAll({ limit: 100, sortBy: 'interviewDate', sortOrder: 'asc' }),
        ]);
        setStats(statsRes.data);
        setRecentJobs(jobsRes.data.jobs);

        const now = new Date();
        const soon = allRes.data.jobs.filter((j) => {
          if (!j.interviewDate) return false;
          const d = new Date(j.interviewDate);
          const diff = (d - now) / (1000 * 60 * 60 * 24);
          return diff >= 0 && diff <= 14;
        });
        setUpcomingInterviews(soon);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;
  }

  const pieData = stats
    ? Object.entries(stats.byStatus).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
    : [];

  const successRate  = stats?.total ? Math.round(((stats.byStatus.Offer || 0) / stats.total) * 100) : 0;
  const responseRate = stats?.total ? Math.round((((stats.byStatus.Interview || 0) + (stats.byStatus.Offer || 0)) / stats.total) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-400 text-sm mt-1">Here's your job search overview</p>
        </div>
        <Link to="/jobs" className="btn-primary text-sm">+ Add Application</Link>
      </div>

      {/* Upcoming interviews alert */}
      {upcomingInterviews.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">🎯</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-400 mb-2">
                {upcomingInterviews.length} interview{upcomingInterviews.length > 1 ? 's' : ''} coming up!
              </p>
              <div className="flex flex-wrap gap-2">
                {upcomingInterviews.map((j) => (
                  <div key={j._id} className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-1.5">
                    <span className="text-xs font-medium text-white">{j.jobTitle}</span>
                    <span className="text-xs text-amber-300">@ {j.company}</span>
                    <span className="text-xs text-amber-400 font-mono">{format(new Date(j.interviewDate), 'MMM d')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Applied" value={stats?.total || 0} icon="📋" accent="border-slate-800" />
        <StatCard label="In Interview" value={stats?.byStatus?.Interview || 0} icon="🎯" accent="border-amber-500/30" sub={`${responseRate}% response`} />
        <StatCard label="Offers" value={stats?.byStatus?.Offer || 0} icon="🎉" accent="border-emerald-500/30" sub={`${successRate}% rate`} />
        <StatCard label="Rejected" value={stats?.byStatus?.Rejected || 0} icon="❌" accent="border-red-500/20" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly bar chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Applications Over Time</h2>
            <span className="text-xs text-slate-600">Last 6 months</span>
          </div>
          {stats?.monthly?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.monthly} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
                <Bar dataKey="count" fill="#6272f1" radius={[6, 6, 0, 0]} name="applications" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">
              No data yet — add your first application!
            </div>
          )}
        </div>

        {/* Donut chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Status Breakdown</h2>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUS_COLORS[entry.name] }} />
                    <span>{entry.name}</span>
                    <span className="text-slate-600 ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-600 text-sm">No applications yet</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent applications */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Applications</h2>
            <Link to="/jobs" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
          </div>
          {recentJobs.length > 0 ? (
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <div key={job._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                    {job.company.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{job.jobTitle}</p>
                    <p className="text-xs text-slate-500 truncate">{job.company}</p>
                  </div>
                  <StatusBadge status={job.status} />
                  <p className="text-xs text-slate-600 hidden sm:block flex-shrink-0">
                    {formatDistanceToNow(new Date(job.dateApplied), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm mb-3">No applications yet.</p>
              <Link to="/jobs" className="btn-primary text-sm">Add your first application</Link>
            </div>
          )}
        </div>

        {/* Performance metrics */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Performance Metrics</h2>
          <div className="space-y-4">
            {[
              { label: 'Response Rate', value: responseRate, desc: 'Applications that reached interview stage', color: 'bg-amber-500' },
              { label: 'Offer Rate', value: successRate, desc: 'Applications that resulted in an offer', color: 'bg-emerald-500' },
              {
                label: 'Rejection Rate',
                value: stats?.total ? Math.round(((stats.byStatus?.Rejected || 0) / stats.total) * 100) : 0,
                desc: 'Applications that were rejected',
                color: 'bg-red-500',
              },
            ].map(({ label, value, desc, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-300">{label}</span>
                  <span className="text-sm font-bold text-white">{value}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(value, 100)}%` }} />
                </div>
                <p className="text-xs text-slate-600 mt-1">{desc}</p>
              </div>
            ))}

            <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-brand-400">{stats?.byStatus?.Interview || 0}</p>
                <p className="text-xs text-slate-500 mt-0.5">Active Processes</p>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-emerald-400">{upcomingInterviews.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Upcoming Interviews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
