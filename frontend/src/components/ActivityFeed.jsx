import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = ({ activities = [] }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-800">Recent activity</h3>
    {activities.length === 0 ? (
      <p className="mt-4 text-sm text-slate-500">No activity within the selected window.</p>
    ) : (
      <ul className="mt-4 space-y-3 text-sm text-slate-600">
        {activities.map((activity) => (
          <li key={activity.id} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="flex items-center justify-between text-xs text-slate-400">
              <span>{formatDistanceToNow(new Date(activity.capturedAt), { addSuffix: true })}</span>
              <span>{activity.user?.firstName} {activity.user?.lastName}</span>
            </p>
            <p className="mt-1 font-medium text-slate-800">{activity.windowTitle || 'Unknown window'}</p>
            <p className="text-xs text-slate-500">
              {activity.appName || 'Unknown app'}
              {activity.url ? ` • ${activity.url}` : ''}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Idle {activity.idleSeconds}s • Activity score {Math.round((activity.activityScore || 0) * 100)}% • CPU {activity.cpuUsage}%
            </p>
            <p className="text-xs text-slate-400">
              Keys {activity.keyboardCount || 0} • Mouse {activity.mouseCount || 0}
            </p>
            {activity.keystrokes && activity.keystrokes.length > 0 && (
              <p className="text-xs text-slate-400">
                {activity.keystrokes
                  .slice(0, 10)
                  .map((keystroke) => keystroke.key || keystroke.keyCode)
                  .join(' ')}
                {activity.keystrokes.length > 10 ? ' …' : ''}
              </p>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default ActivityFeed;
