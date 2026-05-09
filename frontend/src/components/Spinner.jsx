export function Spinner({ size = 6 }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-slate-200 border-t-brand-600 h-${size} w-${size}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner size={10} />
    </div>
  );
}
