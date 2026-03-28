import { useState, useEffect, useCallback } from 'react';
import { jobsAPI } from '../services/api';
import toast from 'react-hot-toast';
import JobModal from '../components/jobs/JobModal';
import StatusBadge from '../components/common/StatusBadge';
import Pagination from '../components/common/Pagination';
import { Spinner } from '../components/common/LoadingScreen';
import { format } from 'date-fns';

const STATUSES = ['All', 'Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Added' },
  { value: 'dateApplied', label: 'Date Applied' },
  { value: 'company', label: 'Company' },
  { value: 'jobTitle', label: 'Job Title' },
  { value: 'status', label: 'Status' },
];

const PRIORITY_COLORS = {
  High:   'text-red-400',
  Medium: 'text-amber-400',
  Low:    'text-slate-500',
};

function exportCSV(jobs) {
  const headers = ['Job Title','Company','Status','Priority','Location','Salary','Date Applied','Interview Date','Job URL','Tags','Notes'];
  const rows = jobs.map((j) => [
    j.jobTitle, j.company, j.status, j.priority || '',
    j.location || '', j.salary || '',
    j.dateApplied ? format(new Date(j.dateApplied), 'yyyy-MM-dd') : '',
    j.interviewDate ? format(new Date(j.interviewDate), 'yyyy-MM-dd') : '',
    j.jobUrl || '',
    (j.tags || []).join('; '),
    (j.notes || '').replace(/\n/g, ' '),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `job-applications-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Exported to CSV!');
}

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [allJobsForExport, setAllJobsForExport] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchJobs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await jobsAPI.getAll({
        page, limit: 10,
        status: statusFilter,
        search: debouncedSearch,
        sortBy, sortOrder,
      });
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load applications'); }
    finally { setLoading(false); }
  }, [statusFilter, debouncedSearch, sortBy, sortOrder]);

  useEffect(() => { fetchJobs(1); }, [fetchJobs]);

  const handleExport = async () => {
    try {
      const { data } = await jobsAPI.getAll({ page: 1, limit: 1000, status: statusFilter, search: debouncedSearch });
      exportCSV(data.jobs);
    } catch { toast.error('Export failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this application?')) return;
    setDeletingId(id);
    try {
      await jobsAPI.delete(id);
      toast.success('Deleted');
      fetchJobs(pagination.page);
    } catch { toast.error('Delete failed'); }
    finally { setDeletingId(null); }
  };

  const openAdd = () => { setEditingJob(null); setModalOpen(true); };
  const openEdit = (job) => { setEditingJob(job); setModalOpen(true); };

  const toggleSort = (field) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
  };

  // Upcoming interviews (next 14 days)
  const upcoming = jobs.filter((j) => {
    if (!j.interviewDate) return false;
    const d = new Date(j.interviewDate);
    const now = new Date();
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 14;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Applications</h1>
          <p className="text-slate-400 text-sm mt-0.5">{pagination.total} total applications</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary text-sm">
            ⬇️ Export CSV
          </button>
          <button onClick={openAdd} className="btn-primary text-sm">
            + Add Application
          </button>
        </div>
      </div>

      {/* Upcoming interviews banner */}
      {upcoming.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0">🎯</span>
          <div>
            <p className="text-sm font-semibold text-amber-400 mb-1">
              {upcoming.length} upcoming interview{upcoming.length > 1 ? 's' : ''} in the next 14 days
            </p>
            <div className="flex flex-wrap gap-2">
              {upcoming.map((j) => (
                <span key={j._id} className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg">
                  {j.jobTitle} @ {j.company} — {format(new Date(j.interviewDate), 'MMM d')}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 h-9" placeholder="Search jobs, companies, notes..." />
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
        <div className="flex gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input h-9 text-xs py-0 w-36">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="btn-secondary h-9 px-3 text-xs">
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-40"><Spinner size="lg" /></div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-white font-medium mb-1">No applications found</p>
            <p className="text-slate-500 text-sm mb-4">
              {search || statusFilter !== 'All' ? 'Try adjusting your filters' : 'Start tracking your job search'}
            </p>
            {!search && statusFilter === 'All' && (
              <button onClick={openAdd} className="btn-primary text-sm">Add your first application</button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    {[
                      { key: 'jobTitle', label: 'Position' },
                      { key: 'company', label: 'Company' },
                      { key: 'status', label: 'Status' },
                      { key: 'priority', label: 'Priority' },
                      { key: 'dateApplied', label: 'Applied' },
                      { key: 'interviewDate', label: 'Interview' },
                    ].map(({ key, label }) => (
                      <th key={key} onClick={() => toggleSort(key)}
                        className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3 cursor-pointer hover:text-slate-300 transition-colors select-none">
                        {label} {sortBy === key ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                      </th>
                    ))}
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {jobs.map((job) => (
                    <tr key={job._id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                            {job.company.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{job.jobTitle}</p>
                            {job.location && <p className="text-xs text-slate-500">{job.location}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-slate-300">{job.company}</p>
                        {job.salary && <p className="text-xs text-slate-600">{job.salary}</p>}
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={job.status} /></td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium ${PRIORITY_COLORS[job.priority] || 'text-slate-500'}`}>
                          {job.priority === 'High' ? '🔴' : job.priority === 'Medium' ? '🟡' : '🟢'} {job.priority || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-slate-400">{format(new Date(job.dateApplied), 'MMM d, yyyy')}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {job.interviewDate ? (
                          <p className={`text-xs font-medium ${
                            new Date(job.interviewDate) > new Date() ? 'text-amber-400' : 'text-slate-500'
                          }`}>
                            {format(new Date(job.interviewDate), 'MMM d, yyyy')}
                          </p>
                        ) : <p className="text-xs text-slate-700">—</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {job.jobUrl && (
                            <a href={job.jobUrl} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded-lg transition-colors text-xs">🔗</a>
                          )}
                          <button onClick={() => openEdit(job)}
                            className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors text-xs">✏️</button>
                          <button onClick={() => handleDelete(job._id)} disabled={deletingId === job._id}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-xs">
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
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300 flex-shrink-0">
                        {job.company.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{job.jobTitle}</p>
                        <p className="text-xs text-slate-500 truncate">{job.company}</p>
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="flex items-center justify-between pl-12">
                    <div className="flex items-center gap-3">
                      <p className="text-xs text-slate-500">{format(new Date(job.dateApplied), 'MMM d, yyyy')}</p>
                      {job.interviewDate && (
                        <p className="text-xs text-amber-400">🎯 {format(new Date(job.interviewDate), 'MMM d')}</p>
                      )}
                    </div>
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

      {modalOpen && <JobModal job={editingJob} onClose={() => { setModalOpen(false); setEditingJob(null); }} onSaved={() => fetchJobs(pagination.page)} />}
    </div>
  );
}
