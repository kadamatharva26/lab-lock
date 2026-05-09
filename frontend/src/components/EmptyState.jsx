export function EmptyState({ title, description, action }) {
  return (
    <div className="text-center py-16 px-6 bg-white border border-dashed border-slate-300 rounded-lg">
      <h3 className="text-lg font-medium text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
