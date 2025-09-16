const statusStyles = {
  planned: 'bg-slate-100 text-slate-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-amber-100 text-amber-700',
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-sky-100 text-sky-700',
  done: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-rose-100 text-rose-700',
  scheduled: 'bg-indigo-100 text-indigo-700',
  missed: 'bg-rose-100 text-rose-700',
  cancelled: 'bg-slate-200 text-slate-600',
  present: 'bg-emerald-100 text-emerald-700',
  late: 'bg-orange-100 text-orange-700',
  absent: 'bg-rose-100 text-rose-700',
  partial: 'bg-amber-100 text-amber-700'
};

const Badge = ({ status, children }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[status] ?? 'bg-slate-100 text-slate-700'}`}>
    {children || status.replace('_', ' ')}
  </span>
);

export default Badge;
