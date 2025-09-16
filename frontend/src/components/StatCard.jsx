const StatCard = ({ title, value, description, icon }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
      </div>
      {icon && <div className="text-3xl">{icon}</div>}
    </div>
    {description && <p className="mt-3 text-xs text-slate-400">{description}</p>}
  </div>
);

export default StatCard;
