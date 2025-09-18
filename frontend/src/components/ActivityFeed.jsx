import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = ({ activities = [] }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm transition-colors duration-300">
    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Recent activity</h3>
    {activities.length === 0 ? (
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No activity within the selected window.</p>
    ) : (
      <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
        {activities.map((activity) => (
          <li key={activity.id} className="rounded-lg border border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-3 transition-colors duration-300">
            <p className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
              <span>{formatDistanceToNow(new Date(activity.capturedAt), { addSuffix: true })}</span>
              <span>{activity.user?.firstName} {activity.user?.lastName}</span>
            </p>
            <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">{activity.windowTitle || 'Unknown window'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activity.appName || 'Unknown app'}
              {activity.url ? ` • ${activity.url}` : ''}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Idle {activity.idleSeconds}s • Activity score {Math.round((activity.activityScore || 0) * 100)}% • CPU {activity.cpuUsage}%
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Keys {activity.keyboardCount || 0} • Mouse {activity.mouseCount || 0}
            </p>
            {activity.keystrokes && activity.keystrokes.length > 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
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
