import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { Spinner } from '../components/common/LoadingScreen';
import { format, formatDistanceToNow } from 'date-fns';

const ACTION_CONFIG = {
  SIGNUP:              { icon: '🎉', color: 'text-emerald-400 bg-emerald-400/10', label: 'Signed Up' },
  LOGIN:               { icon: '🔑', color: 'text-blue-400 bg-blue-400/10',     label: 'Logged In' },
  JOB_CREATED:         { icon: '📝', color: 'text-brand-400 bg-brand-400/10',   label: 'Application Added' },
  JOB_UPDATED:         { icon: '✏️', color: 'text-amber-400 bg-amber-400/10',   label: 'Application Updated' },
  JOB_DELETED:         { icon: '🗑️', color: 'text-red-400 bg-red-400/10',       label: 'Application Deleted' },
  STATUS_CHANGED:      { icon: '🔄', color: 'text-purple-400 bg-purple-400/10', label: 'Status Changed' },
  PROFILE_UPDATED:     { icon: '👤', color: 'text-cyan-400 bg-cyan-400/10',     label: 'Profile Updated' },
  PASSWORD_CHANGED:    { icon: '🔒', color: 'text-orange-400 bg-orange-400/10', label: 'Password Changed' },
  AI_SUGGESTION:       { icon: '🤖', color: 'text-pink-400 bg-pink-400/10',     label: 'AI Suggestion' },
  LOGOUT:              { icon: '🚪', color: 'text-slate-400 bg-slate-400/10',   label: 'Logged Out' },
};

const getConfig = (action) =>
  ACTION_CONFIG[action] || { icon: '📋', color: 'text-slate-400 bg-slate-400/10', label: action };

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getActivity()
      .then(({ data }) => setLogs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group logs by date
  const grouped = logs.reduce((acc, log) => {
    const date = format(new Date(log.createdAt), 'MMMM d, yyyy');
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Activity Log</h1>
        <p className="text-slate-400 text-sm mt-1">Your recent account activity (last 50 events)</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-3xl mb-3">📋</p>
          <p className="text-white font-medium">No activity yet</p>
          <p className="text-slate-500 text-sm mt-1">Your actions will appear here</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayLogs]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">{date}</p>
              <div className="card p-0 divide-y divide-slate-800">
                {dayLogs.map((log) => {
                  const config = getConfig(log.action);
                  return (
                    <div key={log._id} className="flex items-start gap-4 p-4 hover:bg-slate-800/30 transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${config.color}`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-white">{config.label}</p>
                          <p className="text-xs text-slate-600 flex-shrink-0" title={format(new Date(log.createdAt), 'PPpp')}>
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{log.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
