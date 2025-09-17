const StatCard = ({ title, value, description, icon }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm transition-colors duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
      {icon && <div className="text-3xl">{icon}</div>}
    </div>
    {description && <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">{description}</p>}
  </div>
);

export default StatCard;
