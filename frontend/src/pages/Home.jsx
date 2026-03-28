import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { postingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/common/Pagination';
import { Spinner } from '../components/common/LoadingScreen';
import SiteCredit from '../components/common/SiteCredit';
import ThemeToggle from '../components/common/ThemeToggle';
import { formatDistanceToNow } from 'date-fns';
import ApplyModal from '../components/public/ApplyModal';
import toast from 'react-hot-toast';

const JOB_TYPES = ['All', 'Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid', 'Internship'];
const EXPERIENCE = ['All', 'Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager', 'Executive'];

const TYPE_COLORS = {
  'Full-time':  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Part-time':  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Contract':   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Remote':     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Hybrid':     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Internship': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

function JobCard({ posting, onApply, isAuthenticated }) {
  const initials = posting.company.charAt(0).toUpperCase();
  const timeAgo = formatDistanceToNow(new Date(posting.createdAt), { addSuffix: true });
  const typeColor = TYPE_COLORS[posting.type] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  return (
    <div className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-brand-500/40 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300 flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-4 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600/30 to-purple-600/20 border border-brand-500/20 flex items-center justify-center text-lg font-bold text-brand-300 flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-brand-400 transition-colors line-clamp-2">
                {posting.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">{posting.company}</p>
            </div>
            {posting.isFeatured && (
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-lg font-medium flex-shrink-0">
                ⭐ Featured
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${typeColor}`}>
          {posting.type}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-lg border border-slate-700 text-slate-400">
          📍 {posting.location}
        </span>
        {posting.experience && (
          <span className="text-xs px-2 py-0.5 rounded-lg border border-slate-700 text-slate-400">
            {posting.experience}
          </span>
        )}
      </div>

      {/* Salary */}
      {posting.salary && (
        <p className="text-sm font-semibold text-emerald-400 mb-2">{posting.salary}</p>
      )}

      {/* Tags */}
      {posting.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {posting.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-500 rounded-md">
              #{tag}
            </span>
          ))}
          {posting.tags.length > 4 && (
            <span className="text-xs text-slate-600">+{posting.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-800">
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span>{timeAgo}</span>
          {posting.applicantCount > 0 && (
            <span>👤 {posting.applicantCount} applicants</span>
          )}
        </div>
        <div className="flex gap-2">
          <Link
            to={`/jobs/board/${posting._id}`}
            className="text-xs px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Details
          </Link>
          {isAuthenticated ? (
            <button
              onClick={() => onApply(posting)}
              className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition-colors"
            >
              Quick Apply
            </button>
          ) : (
            <Link
              to={`/login?redirect=/jobs/board/${posting._id}`}
              className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition-colors"
            >
              Apply →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [postings, setPostings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [typeFilter, setTypeFilter] = useState('All');
  const [expFilter, setExpFilter] = useState('All');
  const [applyTarget, setApplyTarget] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPostings = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await postingsAPI.getAll({
        page, limit: 9,
        search: debouncedSearch,
        type: typeFilter,
        experience: expFilter,
      });
      setPostings(data.postings);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, expFilter]);

  useEffect(() => { fetchPostings(1); }, [fetchPostings]);

  const handleApply = (posting) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/jobs/board/${posting._id}`);
      return;
    }
    setApplyTarget(posting);
  };

  const handleApplySuccess = () => {
    setApplyTarget(null);
    fetchPostings(pagination.page);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* ─── Top Navigation ────────────────────────────────────────────── */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">JT</div>
            <span className="font-bold text-white text-sm">JobTracker</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm text-brand-400 font-medium">Browse Jobs</Link>
            {isAuthenticated && (
              <Link to="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">Dashboard</Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400 hidden sm:block">Hi, {user?.name?.split(' ')[0]}</span>
                <Link to="/dashboard" className="btn-primary text-xs py-1.5 px-3">
                  My Dashboard →
                </Link>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary text-xs py-1.5 px-3">
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-600/5 rounded-full blur-3xl" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-600/10 border border-brand-500/20 text-brand-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            ✨ {pagination.total}+ open positions available
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            Find your next<br />
            <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              dream role
            </span>
          </h1>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Browse opportunities from top companies. Track every application. Land the job.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPostings(1)}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 pl-11 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  placeholder="Job title, company, or skill..."
                />
              </div>
              <button
                onClick={() => fetchPostings(1)}
                className="btn-primary px-6 py-3 text-sm"
              >
                Search
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-8 mt-10">
            {[
              { label: 'Open Roles', value: pagination.total + '+' },
              { label: 'Top Companies', value: '50+' },
              { label: 'Hired This Month', value: '120+' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main Content ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar filters ── */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sticky top-20">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Job Type</h3>
              <div className="space-y-1 mb-5">
                {JOB_TYPES.map((t) => (
                  <button key={t} onClick={() => setTypeFilter(t)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      typeFilter === t ? 'bg-brand-600/20 text-brand-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>

              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Experience</h3>
              <div className="space-y-1">
                {EXPERIENCE.map((e) => (
                  <button key={e} onClick={() => setExpFilter(e)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      expFilter === e ? 'bg-brand-600/20 text-brand-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}>
                    {e}
                  </button>
                ))}
              </div>

              {(typeFilter !== 'All' || expFilter !== 'All' || search) && (
                <button
                  onClick={() => { setTypeFilter('All'); setExpFilter('All'); setSearch(''); }}
                  className="w-full mt-4 text-xs text-red-400 hover:text-red-300 py-2 text-center"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* CTA for guests */}
            {!isAuthenticated && (
              <div className="mt-4 bg-gradient-to-br from-brand-900/40 to-purple-900/20 border border-brand-500/20 rounded-2xl p-4 text-center">
                <p className="text-2xl mb-2">🚀</p>
                <p className="text-sm font-semibold text-white mb-1">Track everything</p>
                <p className="text-xs text-slate-400 mb-3">Sign up free to track all your applications</p>
                <Link to="/register" className="block w-full text-center text-xs bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg transition-colors font-medium">
                  Get started free
                </Link>
              </div>
            )}
          </aside>

          {/* ── Job listings ── */}
          <main className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-400">
                {loading ? 'Loading...' : (
                  <>
                    <span className="text-white font-medium">{pagination.total}</span> jobs found
                    {debouncedSearch && <> for "<span className="text-brand-400">{debouncedSearch}</span>"</>}
                  </>
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Sorted by: </span>
                <span className="text-slate-300">Latest</span>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : postings.length === 0 ? (
              <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-white font-medium mb-1">No jobs found</p>
                <p className="text-slate-500 text-sm">Try adjusting your search or filters</p>
                <button onClick={() => { setSearch(''); setTypeFilter('All'); setExpFilter('All'); }}
                  className="mt-4 text-sm text-brand-400 hover:text-brand-300">
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {postings.map((posting) => (
                    <JobCard
                      key={posting._id}
                      posting={posting}
                      onApply={handleApply}
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <Pagination
                      page={pagination.page}
                      totalPages={pagination.totalPages}
                      onPageChange={(p) => fetchPostings(p)}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-800 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center text-white font-bold text-xs">JT</div>
            <span className="text-slate-400 text-sm">JobTracker © 2024</span>
          </div>
          <div className="flex gap-6 text-xs text-slate-600">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Contact</span>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4 pt-4 border-t border-slate-800/70">
          <SiteCredit className="text-center sm:text-left" />
        </div>
      </footer>

      {/* Apply modal */}
      {applyTarget && (
        <ApplyModal
          posting={applyTarget}
          onClose={() => setApplyTarget(null)}
          onSuccess={handleApplySuccess}
        />
      )}
    </div>
  );
}
