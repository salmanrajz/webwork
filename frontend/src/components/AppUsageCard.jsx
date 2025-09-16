const AppUsageCard = ({ usage = [] }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-800">Top applications</h3>
    {usage.length === 0 ? (
      <p className="mt-4 text-sm text-slate-500">No activity recorded for this period.</p>
    ) : (
      <ul className="mt-4 space-y-3 text-sm text-slate-600">
        {usage.map((item) => (
          <li key={item.appName} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <p className="font-medium text-slate-800">{item.appName}</p>
              <p className="text-xs text-slate-500">
                Active {Math.round(item.productiveSeconds / 60)}m • Idle {Math.round(item.idleSeconds / 60)}m
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {Math.round(item.activityScore * 100)}%
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default AppUsageCard;
