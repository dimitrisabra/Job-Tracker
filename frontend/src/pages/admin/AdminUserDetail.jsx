import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/common/LoadingScreen';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import { format, formatDistanceToNow } from 'date-fns';
import AdminJobModal from '../../components/admin/AdminJobModal';

const STATUSES = ['All', 'Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];

const PRIORITY_COLORS = {
  High:   'bg-red-500/10 text-red-400 border-red-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Low:    'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobStats, setJobStats] = useState({});
  const [activityLogs, setActivityLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState('applications');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch user info once
  useEffect(() => {
    adminAPI.getUser(userId)
      .then(({ data }) => {
        setUser(data.user);
        setJobStats(data.jobStats);
        setActivityLogs(data.activityLogs);
      })
      .catch(() => { toast.error('User not found'); navigate('/admin/users'); })
      .finally(() => setLoading(false));
  }, [userId, navigate]);

  // Fetch jobs (paginated + filtered)
  const fetchJobs = useCallback(async (page = 1) => {
    setJobsLoading(true);
    try {
      const { data } = await adminAPI.getUserJobs(userId, {
        page, limit: 10, status: statusFilter, search: debouncedSearch,
      });
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setJobsLoading(false);
    }
  }, [userId, statusFilter, debouncedSearch]);

  useEffect(() => { fetchJobs(1); }, [fetchJobs]);

  const handleDelete = async (jobId) => {
    if (!confirm('Delete this application?')) return;
    setDeletingId(jobId);
    try {
      await adminAPI.deleteJobForUser(userId, jobId);
      toast.success('Application deleted');
      fetchJobs(pagination.page);
      // refresh stats
      adminAPI.getUser(userId).then(({ data }) => setJobStats(data.jobStats)).catch(() => {});
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusToggle = async () => {
    if (!confirm(`${user.status === 'active' ? 'Suspend' : 'Activate'} ${user.name}?`)) return;
    setActionLoading(true);
    try {
      const newStatus = user.status === 'active' ? 'suspended' : 'active';
      await adminAPI.updateStatus(userId, newStatus);
      setUser({ ...user, status: newStatus });
      toast.success(`User ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openAdd = () => { setEditingJob(null); setModalOpen(true); };
  const openEdit = (job) => { setEditingJob(job); setModalOpen(true); };
  const onSaved = () => {
    fetchJobs(pagination.page);
    adminAPI.getUser(userId).then(({ data }) => setJobStats(data.jobStats)).catch(() => {});
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
  }

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-slide-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/admin/users" className="hover:text-slate-300 transition-colors">← Manage Users</Link>
      </div>

      {/* User header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border-2 border-brand-500/30 flex items-center justify-center text-brand-400 text-lg font-bold flex-shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">{user?.name}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${
                  user?.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {user?.status === 'active' ? '● Active' : '● Suspended'}
                </span>
              </div>
              <p className="text-sm text-slate-400 font-mono">{user?.email}</p>
              <p className="text-xs text-slate-600 mt-1">
                Joined {user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : '—'}
                {user?.lastLogin && ` · Last login ${formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}`}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleStatusToggle}
              disabled={actionLoading}
              className={`text-sm px-4 py-2 rounded-xl font-medium border transition-all ${
                user?.status === 'active'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
              }`}
            >
              {actionLoading ? <Spinner size="sm" /> : user?.status === 'active' ? '🚫 Suspend User' : '✅ Activate User'}
            </button>
            <button
              onClick={openAdd}
              className="btn-primary text-sm"
            >
              + Add Application
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-5 border-t border-slate-800">
          {[
            { label: 'Total', value: pagination.total || 0, color: 'text-white' },
            { label: 'Applied', value: jobStats?.Applied || 0, color: 'text-blue-400' },
            { label: 'Interview', value: jobStats?.Interview || 0, color: 'text-amber-400' },
            { label: 'Offer', value: jobStats?.Offer || 0, color: 'text-emerald-400' },
            { label: 'Rejected', value: jobStats?.Rejected || 0, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center bg-slate-800/40 rounded-xl py-3">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {['applications', 'activity'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab === 'applications' ? `💼 Applications (${pagination.total})` : `📋 Activity Log`}
          </button>
        ))}
      </div>

      {activeTab === 'applications' && (
        <>
          {/* Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 h-9" placeholder="Search applications..." />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    statusFilter === s ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Applications table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {jobsLoading ? (
              <div className="flex justify-center items-center h-40"><Spinner size="lg" /></div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-white font-medium mb-1">No applications found</p>
                <button onClick={openAdd} className="btn-primary text-sm mt-3">
                  + Add First Application
                </button>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        {['Position', 'Company', 'Status', 'Priority', 'Applied', 'Interview', 'Actions'].map((h) => (
                          <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {jobs.map((job) => (
                        <tr key={job._id} className="hover:bg-slate-800/30 transition-colors group">
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-medium text-white">{job.jobTitle}</p>
                            {job.location && <p className="text-xs text-slate-500">{job.location}</p>}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 flex-shrink-0">
                                {job.company.charAt(0)}
                              </div>
                              <p className="text-sm text-slate-300">{job.company}</p>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={job.status} />
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs px-2 py-0.5 rounded-md border font-medium ${PRIORITY_COLORS[job.priority] || PRIORITY_COLORS.Medium}`}>
                              {job.priority || 'Medium'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-xs text-slate-500">{format(new Date(job.dateApplied), 'MMM d, yyyy')}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-xs text-slate-500">
                              {job.interviewDate ? format(new Date(job.interviewDate), 'MMM d, yyyy') : '—'}
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(job)}
                                className="text-xs px-2.5 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors">
                                ✏️ Edit
                              </button>
                              <button onClick={() => handleDelete(job._id)} disabled={deletingId === job._id}
                                className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                                {deletingId === job._id ? <Spinner size="sm" /> : '🗑️'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-800">
                  {jobs.map((job) => (
                    <div key={job._id} className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <p className="text-sm font-medium text-white">{job.jobTitle}</p>
                          <p className="text-xs text-slate-500">{job.company}</p>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-600">{format(new Date(job.dateApplied), 'MMM d, yyyy')}</p>
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(job)} className="text-xs text-brand-400">Edit</button>
                          <button onClick={() => handleDelete(job._id)} className="text-xs text-red-400">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => fetchJobs(p)} />
            </div>
          )}
        </>
      )}

      {activeTab === 'activity' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-0 divide-y divide-slate-800">
          {activityLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">No activity recorded</div>
          ) : activityLogs.map((log) => (
            <div key={log._id} className="flex items-start gap-3 p-4 hover:bg-slate-800/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs flex-shrink-0">📋</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 truncate">{log.description}</p>
                <p className="text-xs text-slate-600 mt-0.5">{log.action}</p>
              </div>
              <p className="text-xs text-slate-600 flex-shrink-0" title={format(new Date(log.createdAt), 'PPpp')}>
                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Admin job modal */}
      {modalOpen && (
        <AdminJobModal
          userId={userId}
          job={editingJob}
          onClose={() => { setModalOpen(false); setEditingJob(null); }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
