const STATUS_CONFIG = {
  Applied:   { color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',   dot: 'bg-blue-400',   icon: '📝' },
  Interview: { color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', dot: 'bg-amber-400',  icon: '🎯' },
  Offer:     { color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', dot: 'bg-emerald-400', icon: '🎉' },
  Rejected:  { color: 'text-red-400 bg-red-400/10 border-red-400/20',       dot: 'bg-red-400',    icon: '❌' },
};

export default function StatusBadge({ status, showIcon = false }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Applied;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${config.color}`}>
      {showIcon ? (
        <span>{config.icon}</span>
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      )}
      {status}
    </span>
  );
}

export { STATUS_CONFIG };
