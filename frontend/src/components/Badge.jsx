const statusStyles = {
  planned: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  active: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
  completed: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
  on_hold: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
  todo: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  in_progress: 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300',
  done: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
  blocked: 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300',
  scheduled: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300',
  missed: 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300',
  cancelled: 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300',
  present: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
  late: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
  absent: 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300',
  partial: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
};

const Badge = ({ status, children }) => (
  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusStyles[status] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
    {children || status.replace('_', ' ')}
  </span>
);

export default Badge;
