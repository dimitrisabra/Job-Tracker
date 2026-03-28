import { useState, useEffect } from 'react';
import { postingsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Spinner } from '../common/LoadingScreen';

const TYPES = ['Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid', 'Internship'];
const EXPERIENCE_LEVELS = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead', 'Manager', 'Executive'];

const initial = {
  title: '', company: '', description: '',
  requirements: '', responsibilities: '',
  location: 'Remote', type: 'Full-time',
  salary: '', salaryMin: '', salaryMax: '',
  tags: '', experience: 'Mid Level',
  deadline: '', isFeatured: false, isActive: true,
};

export default function PostingModal({ posting, onClose, onSaved }) {
  const isEditing = !!posting;
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (posting) {
      setForm({
        title: posting.title || '',
        company: posting.company || '',
        description: posting.description || '',
        requirements: posting.requirements?.join('\n') || '',
        responsibilities: posting.responsibilities?.join('\n') || '',
        location: posting.location || 'Remote',
        type: posting.type || 'Full-time',
        salary: posting.salary || '',
        salaryMin: posting.salaryMin || '',
        salaryMax: posting.salaryMax || '',
        tags: posting.tags?.join(', ') || '',
        experience: posting.experience || 'Mid Level',
        deadline: posting.deadline ? new Date(posting.deadline).toISOString().split('T')[0] : '',
        isFeatured: posting.isFeatured || false,
        isActive: posting.isActive !== false,
      });
    }
  }, [posting]);

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim() || !form.description.trim()) {
      return toast.error('Title, company and description are required');
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        requirements: form.requirements.split('\n').map((r) => r.trim()).filter(Boolean),
        responsibilities: form.responsibilities.split('\n').map((r) => r.trim()).filter(Boolean),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        salaryMin: form.salaryMin ? Number(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : undefined,
        deadline: form.deadline || null,
      };

      if (isEditing) {
        await postingsAPI.adminUpdate(posting._id, payload);
        toast.success('Posting updated!');
      } else {
        await postingsAPI.adminCreate(payload);
        toast.success('Job posting created! 📌');
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
    { id: 'info', label: 'Basic Info' },
    { id: 'details', label: 'Job Details' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-slide-up max-h-[92vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-base font-bold text-white">
            {isEditing ? 'Edit Job Posting' : 'Create Job Posting'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-slate-800 flex-shrink-0">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <form id="posting-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Job Title *</label>
                  <input type="text" name="title" value={form.title} onChange={handleChange}
                    className="input" placeholder="Senior Frontend Engineer" required />
                </div>
                <div>
                  <label className="label">Company *</label>
                  <input type="text" name="company" value={form.company} onChange={handleChange}
                    className="input" placeholder="Acme Corp" required />
                </div>
              </div>

              <div>
                <label className="label">Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange}
                  className="input resize-none" rows={6}
                  placeholder="Describe the role, team culture, and what makes it exciting..." required />
              </div>

              <div>
                <label className="label">Requirements <span className="text-slate-600 text-xs">(one per line)</span></label>
                <textarea name="requirements" value={form.requirements} onChange={handleChange}
                  className="input resize-none font-mono text-xs" rows={4}
                  placeholder={"5+ years React experience\nTypeScript proficiency\nStrong CSS skills"} />
              </div>

              <div>
                <label className="label">Responsibilities <span className="text-slate-600 text-xs">(one per line)</span></label>
                <textarea name="responsibilities" value={form.responsibilities} onChange={handleChange}
                  className="input resize-none font-mono text-xs" rows={4}
                  placeholder={"Build and maintain React components\nMentor junior engineers\nCollaborate with design team"} />
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Location</label>
                  <input type="text" name="location" value={form.location} onChange={handleChange}
                    className="input" placeholder="Remote, San Francisco, CA..." />
                </div>
                <div>
                  <label className="label">Job Type</label>
                  <select name="type" value={form.type} onChange={handleChange} className="input">
                    {TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Experience Level</label>
                  <select name="experience" value={form.experience} onChange={handleChange} className="input">
                    {EXPERIENCE_LEVELS.map((e) => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Salary (display)</label>
                  <input type="text" name="salary" value={form.salary} onChange={handleChange}
                    className="input" placeholder="$120k – $150k" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Salary Min ($)</label>
                  <input type="number" name="salaryMin" value={form.salaryMin} onChange={handleChange}
                    className="input" placeholder="120000" />
                </div>
                <div>
                  <label className="label">Salary Max ($)</label>
                  <input type="number" name="salaryMax" value={form.salaryMax} onChange={handleChange}
                    className="input" placeholder="150000" />
                </div>
              </div>

              <div>
                <label className="label">Skills / Tags <span className="text-slate-600 text-xs">(comma separated)</span></label>
                <input type="text" name="tags" value={form.tags} onChange={handleChange}
                  className="input" placeholder="react, typescript, nodejs, postgresql" />
              </div>

              <div>
                <label className="label">Application Deadline</label>
                <input type="date" name="deadline" value={form.deadline} onChange={handleChange} className="input" />
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-xl p-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange}
                    className="w-4 h-4 rounded accent-brand-500" />
                  <div>
                    <p className="text-sm font-medium text-white">Active listing</p>
                    <p className="text-xs text-slate-500">Visible to all visitors on the public job board</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange}
                    className="w-4 h-4 rounded accent-brand-500" />
                  <div>
                    <p className="text-sm font-medium text-white">⭐ Featured posting</p>
                    <p className="text-xs text-slate-500">Highlighted at the top of search results</p>
                  </div>
                </label>
              </div>

              <div className="bg-slate-800/30 rounded-xl p-4">
                <p className="text-xs text-slate-500 font-medium mb-2">Preview</p>
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
                  <p className="font-semibold text-white text-sm">{form.title || 'Job Title'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{form.company || 'Company'} · {form.location}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-lg">{form.type}</span>
                    {form.salary && <span className="text-xs text-emerald-400 font-medium">{form.salary}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="submit" form="posting-form" disabled={loading} className="btn-primary">
            {loading ? <><Spinner size="sm" />{isEditing ? 'Saving…' : 'Creating…'}</> : isEditing ? '✓ Save Changes' : '📌 Publish Posting'}
          </button>
        </div>
      </div>
    </div>
  );
}
