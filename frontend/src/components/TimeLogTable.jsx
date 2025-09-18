import { format } from 'date-fns';
import Badge from './Badge.jsx';

const formatMinutes = (value = 0) => {
  const minutes = Math.max(0, Math.round(value));
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining}m`;
};

const TimeLogTable = ({ logs = [] }) => (
  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-colors duration-300">
    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600 text-sm">
      <thead className="bg-slate-50 dark:bg-slate-700 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 transition-colors duration-300">
        <tr>
          <th className="px-4 py-3">Task</th>
          <th className="px-4 py-3">Project</th>
          <th className="px-4 py-3">Start</th>
          <th className="px-4 py-3">End</th>
          <th className="px-4 py-3">Duration</th>
          <th className="px-4 py-3">Note</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-600">
        {logs.map((log) => (
          <tr key={log.id} className="text-slate-600 dark:text-slate-300 transition-colors duration-300">
            <td className="px-4 py-3">
              <div className="font-medium text-slate-800 dark:text-slate-100">{log.task?.title || 'Task removed'}</div>
              <Badge status={log.task?.status || 'todo'}>
                {(log.task?.status || 'todo').replace('_', ' ')}
              </Badge>
            </td>
            <td className="px-4 py-3">{log.task?.project?.name}</td>
            <td className="px-4 py-3">{format(new Date(log.startTime), 'PPpp')}</td>
            <td className="px-4 py-3">{log.endTime ? format(new Date(log.endTime), 'PPpp') : 'In progress'}</td>
            <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
              {formatMinutes(log.durationMinutes || 0)}
            </td>
            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{log.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
    {logs.length === 0 && <div className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">No time logs found.</div>}
  </div>
);

export default TimeLogTable;
