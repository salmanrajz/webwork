const EmptyState = ({ title, description, action }) => (
  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
    <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
    {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
