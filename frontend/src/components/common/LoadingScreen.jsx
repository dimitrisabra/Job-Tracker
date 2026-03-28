export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div
      className={`${sizes[size]} border-2 border-slate-700 border-t-brand-500 rounded-full animate-spin ${className}`}
    />
  );
}

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center gap-4 z-50">
      <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
        JT
      </div>
      <Spinner size="lg" />
      <p className="text-slate-500 text-sm">Loading...</p>
    </div>
  );
}
