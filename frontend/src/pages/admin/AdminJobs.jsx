import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/common/LoadingScreen';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import { format } from 'date-fns';

const STATUSES = ['All', 'Applied', 'Interview', 'Offer', 'Rejected'];

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchJobs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getAllJobs({
        page, limit: 15,
        search: debouncedSearch,
        status: statusFilter,
      });
      setJobs(data.jobs);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => { fetchJobs(1); }, [fetchJobs]);

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">All Applications</h1>
        <p className="text-slate-400 text-sm mt-1">{pagination.total} total applications across all users</p>
      </div>

      {/* Filters */}
      <div className="card py-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 h-9" placeholder="Search job titles, companies..." />
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

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-40"><Spinner size="lg" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🗂️</p>
            <p className="text-white font-medium">No applications found</p>
            <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Position', 'Company', 'User', 'Status', 'Applied', 'Location'].map((h) => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {jobs.map((job) => (
                    <tr key={job._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-white">{job.jobTitle}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                            {job.company.charAt(0)}
                          </div>
                          <p className="text-sm text-slate-300">{job.company}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-xs font-medium text-slate-300">{job.user?.name || '—'}</p>
                          <p className="text-xs text-slate-600 font-mono">{job.user?.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-slate-500">{format(new Date(job.dateApplied), 'MMM d, yyyy')}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-slate-500">{job.location || '—'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="md:hidden divide-y divide-slate-800">
              {jobs.map((job) => (
                <div key={job._id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{job.jobTitle}</p>
                      <p className="text-xs text-slate-500">{job.company}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-600">by {job.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-600">{format(new Date(job.dateApplied), 'MMM d, yyyy')}</p>
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
    </div>
  );
}
