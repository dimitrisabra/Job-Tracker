export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;

  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  const btnBase = 'w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center';
  const btnActive = 'bg-brand-600 text-white';
  const btnInactive = 'text-slate-400 hover:text-white hover:bg-slate-800';
  const btnDisabled = 'text-slate-700 cursor-not-allowed';

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={`${btnBase} ${page === 1 ? btnDisabled : btnInactive}`}
      >
        ‹
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className={`${btnBase} ${btnInactive}`}>1</button>
          {start > 2 && <span className="text-slate-600 px-1">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-slate-600 px-1">…</span>}
          <button onClick={() => onPageChange(totalPages)} className={`${btnBase} ${btnInactive}`}>{totalPages}</button>
        </>
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={`${btnBase} ${page === totalPages ? btnDisabled : btnInactive}`}
      >
        ›
      </button>
    </div>
  );
}
