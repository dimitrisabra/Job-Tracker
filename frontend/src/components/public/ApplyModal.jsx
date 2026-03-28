import { useState } from 'react';
import { postingsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Spinner } from '../common/LoadingScreen';

export default function ApplyModal({ posting, onClose, onSuccess }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    try {
      await postingsAPI.apply(posting._id, { coverLetter, notes });
      toast.success(`Applied to ${posting.title} at ${posting.company}! 🎉`);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4 border-b border-slate-800">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-600/30 to-purple-600/20 border border-brand-500/20 flex items-center justify-center font-bold text-brand-300 flex-shrink-0">
            {posting.company.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-white">{posting.title}</h2>
            <p className="text-sm text-slate-400">{posting.company} · {posting.location}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors">✕</button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <div className="bg-brand-600/5 border border-brand-500/20 rounded-xl px-4 py-3">
            <p className="text-xs text-brand-400 font-medium">✓ This application will be automatically tracked in your dashboard</p>
          </div>

          <div>
            <label className="label">Cover Letter <span className="text-slate-600">(optional)</span></label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="input resize-none"
              rows={4}
              placeholder="Briefly introduce yourself and explain why you're a great fit for this role..."
            />
          </div>

          <div>
            <label className="label">Application Notes <span className="text-slate-600">(private)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input resize-none"
              rows={2}
              placeholder="Personal notes, reminders, interview prep points..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={handleApply} disabled={loading} className="btn-primary flex-1 justify-center">
            {loading ? <><Spinner size="sm" /> Applying…</> : '🚀 Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
