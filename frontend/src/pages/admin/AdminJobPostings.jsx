import { useState, useEffect, useCallback } from 'react';
import { postingsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Spinner } from '../../components/common/LoadingScreen';
import Pagination from '../../components/common/Pagination';
import { format } from 'date-fns';
import PostingModal from '../../components/admin/PostingModal';

export default function AdminJobPostings() {
  const [postings, setPostings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPosting, setEditingPosting] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPostings = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await postingsAPI.adminGetAll({
        page, limit: 10,
        search: debouncedSearch,
        isActive: statusFilter === 'Active' ? 'true' : statusFilter === 'Inactive' ? 'false' : 'All',
      });
      setPostings(data.postings);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load postings');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => { fetchPostings(1); }, [fetchPostings]);

  const handleToggle = async (posting) => {
    setActionLoading(posting._id + '_toggle');
    try {
      await postingsAPI.adminToggle(posting._id);
      toast.success(`Posting ${posting.isActive ? 'deactivated' : 'activated'}`);
      fetchPostings(pagination.page);
    } catch {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this job posting?')) return;
    setActionLoading(id + '_delete');
    try {
      await postingsAPI.adminDelete(id);
      toast.success('Posting deleted');
      fetchPostings(pagination.page);
    } catch {
      toast.error('Delete failed');
    } finally {
      setActionLoading(null);
    }
  };

  const openAdd = () => { setEditingPosting(null); setModalOpen(true); };
  const openEdit = (p) => { setEditingPosting(p); setModalOpen(true); };
  const onSaved = () => fetchPostings(pagination.page);

  const TYPE_COLORS = {
    'Full-time': 'bg-blue-500/10 text-blue-400',
    'Remote': 'bg-emerald-500/10 text-emerald-400',
    'Contract': 'bg-orange-500/10 text-orange-400',
    'Hybrid': 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Postings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage public job board listings</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Create Posting</button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 h-9" placeholder="Search postings..." />
        </div>
        <div className="flex gap-1">
          {['All', 'Active', 'Inactive'].map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-40"><Spinner size="lg" /></div>
        ) : postings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">📌</p>
            <p className="text-white font-medium mb-1">No job postings yet</p>
            <button onClick={openAdd} className="btn-primary text-sm mt-3">Create first posting</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Position', 'Type', 'Salary', 'Applicants', 'Views', 'Status', 'Posted', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {postings.map((posting) => (
                  <tr key={posting._id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                          {posting.company.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{posting.title}</p>
                          <p className="text-xs text-slate-500">{posting.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${TYPE_COLORS[posting.type] || 'bg-slate-500/10 text-slate-400'}`}>
                        {posting.type}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-emerald-400 font-medium">{posting.salary || '—'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-white font-medium">{posting.applicantCount || 0}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-400">{posting.viewCount || 0}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium border ${
                        posting.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-500/10 text-slate-500 border-slate-600'
                      }`}>
                        {posting.isActive ? '● Live' : '● Inactive'}
                      </span>
                      {posting.isFeatured && (
                        <span className="ml-1 text-xs text-amber-400">⭐</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs text-slate-500">{format(new Date(posting.createdAt), 'MMM d, yyyy')}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(posting)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 transition-colors">
                          ✏️
                        </button>
                        <button onClick={() => handleToggle(posting)} disabled={!!actionLoading}
                          className={`text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                            posting.isActive
                              ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}>
                          {actionLoading === posting._id + '_toggle' ? <Spinner size="sm" /> : posting.isActive ? '⏸' : '▶'}
                        </button>
                        <button onClick={() => handleDelete(posting._id)} disabled={!!actionLoading}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                          {actionLoading === posting._id + '_delete' ? <Spinner size="sm" /> : '🗑️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => fetchPostings(p)} />
        </div>
      )}

      {modalOpen && (
        <PostingModal posting={editingPosting} onClose={() => { setModalOpen(false); setEditingPosting(null); }} onSaved={onSaved} />
      )}
    </div>
  );
}
