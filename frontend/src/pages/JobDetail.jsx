import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { postingsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/common/LoadingScreen';
import SiteCredit from '../components/common/SiteCredit';
import ThemeToggle from '../components/common/ThemeToggle';
import ApplyModal from '../components/public/ApplyModal';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const TYPE_COLORS = {
  'Full-time':  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Remote':     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Contract':   'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Hybrid':     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Part-time':  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Internship': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

export default function JobDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [posting, setPosting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    postingsAPI.getOne(id)
      .then(({ data }) => setPosting(data))
      .catch(() => { toast.error('Job not found'); navigate('/'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!posting) return null;

  const typeColor = TYPE_COLORS[posting.type] || 'bg-slate-500/10 text-slate-400';
  const isExpired = posting.deadline && new Date(posting.deadline) < new Date();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">JT</div>
            <span className="font-bold text-white text-sm">JobTracker</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-secondary text-xs py-1.5 px-3">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">Sign in</Link>
                <Link to="/register" className="btn-primary text-xs py-1.5 px-3">Sign up free</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link to="/" className="hover:text-slate-300 transition-colors">← Back to Jobs</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-600/30 to-purple-600/20 border border-brand-500/20 flex items-center justify-center text-xl font-bold text-brand-300 flex-shrink-0">
                  {posting.company.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h1 className="text-xl font-bold text-white">{posting.title}</h1>
                      <p className="text-slate-400 mt-0.5 font-medium">{posting.company}</p>
                    </div>
                    {posting.isFeatured && (
                      <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-lg font-medium">
                        ⭐ Featured
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${typeColor}`}>{posting.type}</span>
                    <span className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400">📍 {posting.location}</span>
                    <span className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400">{posting.experience}</span>
                    {posting.deadline && !isExpired && (
                      <span className="text-xs px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400">
                        ⏰ Apply by {format(new Date(posting.deadline), 'MMM d, yyyy')}
                      </span>
                    )}
                    {isExpired && (
                      <span className="text-xs px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 bg-red-500/10">
                        ⚠️ Application closed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                    <span>Posted {formatDistanceToNow(new Date(posting.createdAt), { addSuffix: true })}</span>
                    <span>👤 {posting.applicantCount || 0} applicants</span>
                    <span>👁️ {posting.viewCount || 0} views</span>
                  </div>
                </div>
              </div>

              {posting.salary && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Salary Range</p>
                  <p className="text-lg font-bold text-emerald-400">{posting.salary}</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4">About this role</h2>
              <div className="prose prose-sm prose-invert max-w-none">
                {posting.description.split('\n').map((para, i) => (
                  para.trim() ? <p key={i} className="text-slate-300 text-sm leading-relaxed mb-3">{para}</p> : <br key={i} />
                ))}
              </div>
            </div>

            {/* Requirements */}
            {posting.requirements?.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-white mb-4">Requirements</h2>
                <ul className="space-y-2.5">
                  {posting.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="text-brand-400 mt-0.5 flex-shrink-0">✓</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Responsibilities */}
            {posting.responsibilities?.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-white mb-4">Responsibilities</h2>
                <ul className="space-y-2.5">
                  {posting.responsibilities.map((res, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="text-emerald-400 mt-0.5 flex-shrink-0">→</span>
                      {res}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {posting.tags?.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-white mb-3">Skills & Technologies</h2>
                <div className="flex flex-wrap gap-2">
                  {posting.tags.map((tag) => (
                    <span key={tag} className="text-sm px-3 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar: Apply card ── */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sticky top-20">
              {posting.alreadyApplied ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-2xl mx-auto mb-3">
                    ✅
                  </div>
                  <p className="font-semibold text-white mb-1">Already Applied!</p>
                  <p className="text-sm text-slate-400 mb-4">Track your application in your dashboard.</p>
                  <Link to="/jobs" className="block w-full text-center btn-primary justify-center text-sm">
                    View My Applications
                  </Link>
                </div>
              ) : isExpired ? (
                <div className="text-center">
                  <p className="text-red-400 font-medium mb-1">Applications Closed</p>
                  <p className="text-sm text-slate-500">This position is no longer accepting applications.</p>
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-white mb-1">Ready to apply?</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    {isAuthenticated
                      ? 'Apply now and we\'ll track it automatically in your dashboard.'
                      : 'Create a free account to apply and track your application.'}
                  </p>

                  {isAuthenticated ? (
                    <button
                      onClick={() => setApplyOpen(true)}
                      className="w-full btn-primary justify-center text-sm py-3"
                    >
                      🚀 Apply Now
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <Link to={`/register?redirect=/jobs/board/${id}`}
                        className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white font-medium py-3 rounded-xl transition-colors text-sm">
                        Sign up to Apply
                      </Link>
                      <Link to={`/login?redirect=/jobs/board/${id}`}
                        className="block w-full text-center bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-xl transition-colors text-sm border border-slate-700">
                        Already have an account? Sign in
                      </Link>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>📋</span>
                      <span>Application tracked automatically</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>🔔</span>
                      <span>Status update notifications</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>🤖</span>
                      <span>AI-powered notes improvement</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Company card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">About the Company</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600/30 to-purple-600/20 border border-brand-500/20 flex items-center justify-center font-bold text-brand-300">
                  {posting.company.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{posting.company}</p>
                  <p className="text-xs text-slate-500">{posting.location}</p>
                </div>
              </div>
            </div>

            <Link to="/" className="block text-center text-sm text-slate-400 hover:text-white transition-colors py-2">
              ← View all jobs
            </Link>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">JobTracker © 2024</p>
          <SiteCredit className="sm:text-right" />
        </div>
      </footer>

      {applyOpen && (
        <ApplyModal
          posting={posting}
          onClose={() => setApplyOpen(false)}
          onSuccess={() => { setApplyOpen(false); setPosting({ ...posting, alreadyApplied: true }); }}
        />
      )}
    </div>
  );
}
