import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Spinner } from '../common/LoadingScreen';

const STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected', 'Withdrawn'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const STATUS_COLORS = {
  Applied:   'border-blue-500 bg-blue-500/10 text-blue-400',
  Interview: 'border-amber-500 bg-amber-500/10 text-amber-400',
  Offer:     'border-emerald-500 bg-emerald-500/10 text-emerald-400',
  Rejected:  'border-red-500 bg-red-500/10 text-red-400',
  Withdrawn: 'border-slate-500 bg-slate-500/10 text-slate-400',
};

const PRIORITY_COLORS = {
  Low:    'border-slate-600 bg-slate-600/10 text-slate-400',
  Medium: 'border-amber-500 bg-amber-500/10 text-amber-400',
  High:   'border-red-500 bg-red-500/10 text-red-400',
};

const initialForm = {
  jobTitle: '', company: '', status: 'Applied', priority: 'Medium',
  notes: '', coverLetter: '', dateApplied: new Date().toISOString().split('T')[0],
  interviewDate: '', location: '', salary: '', jobUrl: '',
  contactName: '', contactEmail: '', tags: '', statusNote: '',
};

export default function AdminJobModal({ userId, job, onClose, onSaved }) {
  const isEditing = !!job;
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (job) {
      setForm({
        jobTitle: job.jobTitle || '',
        company: job.company || '',
        status: job.status || 'Applied',
        priority: job.priority || 'Medium',
        notes: job.notes || '',
        coverLetter: job.coverLetter || '',
        dateApplied: job.dateApplied ? new Date(job.dateApplied).toISOString().split('T')[0] : '',
        interviewDate: job.interviewDate ? new Date(job.interviewDate).toISOString().split('T')[0] : '',
        location: job.location || '',
        salary: job.salary || '',
        jobUrl: job.jobUrl || '',
        contactName: job.contactName || '',
        contactEmail: job.contactEmail || '',
        tags: job.tags?.join(', ') || '',
        statusNote: '',
      });
    }
  }, [job]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.jobTitle.trim() || !form.company.trim()) {
      return toast.error('Job title and company are required');
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        interviewDate: form.interviewDate || null,
      };

      if (isEditing) {
        await adminAPI.updateJobForUser(userId, job._id, payload);
        toast.success('Application updated!');
      } else {
        await adminAPI.createJobForUser(userId, payload);
        toast.success('Application created for user!');
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: '📋 Basic Info' },
    { id: 'status', label: '🔄 Status & Priority' },
    { id: 'details', label: '📎 Details' },
    { id: 'notes', label: '📝 Notes' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-slide-up max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-brand-600/20 text-brand-400 border border-brand-500/30 px-2 py-0.5 rounded-md font-medium">
                ⚡ Admin
              </span>
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'Edit Application' : 'Add Application for User'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Changes apply to the user's account directly</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-slate-800 flex-shrink-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <form id="admin-job-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          {/* Basic tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Job Title *</label>
                  <input type="text" name="jobTitle" value={form.jobTitle} onChange={handleChange}
                    className="input" placeholder="e.g. Senior Frontend Engineer" required />
                </div>
                <div>
                  <label className="label">Company *</label>
                  <input type="text" name="company" value={form.company} onChange={handleChange}
                    className="input" placeholder="e.g. Stripe" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Date Applied</label>
                  <input type="date" name="dateApplied" value={form.dateApplied} onChange={handleChange} className="input" />
                </div>
                <div>
                  <label className="label">Interview Date</label>
                  <input type="date" name="interviewDate" value={form.interviewDate} onChange={handleChange} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Location</label>
                  <input type="text" name="location" value={form.location} onChange={handleChange}
                    className="input" placeholder="Remote, NYC..." />
                </div>
                <div>
                  <label className="label">Salary</label>
                  <input type="text" name="salary" value={form.salary} onChange={handleChange}
                    className="input" placeholder="$120k–$150k" />
                </div>
              </div>
              <div>
                <label className="label">Job URL</label>
                <input type="url" name="jobUrl" value={form.jobUrl} onChange={handleChange}
                  className="input" placeholder="https://company.com/careers/123" />
              </div>
              <div>
                <label className="label">Tags (comma separated)</label>
                <input type="text" name="tags" value={form.tags} onChange={handleChange}
                  className="input" placeholder="react, typescript, remote" />
              </div>
            </div>
          )}

          {/* Status tab */}
          {activeTab === 'status' && (
            <div className="space-y-5">
              <div>
                <label className="label mb-3">Application Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STATUSES.map((s) => (
                    <button key={s} type="button" onClick={() => setForm({ ...form, status: s })}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        form.status === s ? STATUS_COLORS[s] : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label mb-3">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                      className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        form.priority === p ? PRIORITY_COLORS[p] : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}>
                      {p === 'High' ? '🔴' : p === 'Medium' ? '🟡' : '🟢'} {p}
                    </button>
                  ))}
                </div>
              </div>

              {isEditing && (
                <div>
                  <label className="label">Status Change Note <span className="text-slate-600">(sent in notification)</span></label>
                  <input type="text" name="statusNote" value={form.statusNote} onChange={handleChange}
                    className="input" placeholder="Reason for status change..." />
                </div>
              )}

              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <p className="text-xs text-slate-500 font-medium mb-2">ℹ️ Admin note</p>
                <p className="text-xs text-slate-400">
                  Changing the status will automatically send an email notification to the user about their application update.
                </p>
              </div>
            </div>
          )}

          {/* Details tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Contact Name</label>
                  <input type="text" name="contactName" value={form.contactName} onChange={handleChange}
                    className="input" placeholder="Recruiter / Hiring Manager" />
                </div>
                <div>
                  <label className="label">Contact Email</label>
                  <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange}
                    className="input" placeholder="recruiter@company.com" />
                </div>
              </div>
              <div>
                <label className="label">Cover Letter</label>
                <textarea name="coverLetter" value={form.coverLetter} onChange={handleChange}
                  className="input resize-none" rows={6}
                  placeholder="Cover letter content..." />
              </div>
            </div>
          )}

          {/* Notes tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div>
                <label className="label">Application Notes</label>
                <textarea name="notes" value={form.notes} onChange={handleChange}
                  className="input resize-none" rows={8}
                  placeholder="Notes about this application, interview prep, contacts, salary negotiation details..." />
                <p className="text-xs text-slate-600 mt-1">{form.notes.length}/5000</p>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="admin-job-form" disabled={loading} className="btn-primary">
            {loading ? <><Spinner size="sm" />{isEditing ? 'Saving…' : 'Creating…'}</> : isEditing ? '✓ Save Changes' : '+ Create Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
