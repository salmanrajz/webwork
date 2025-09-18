import { format, formatDistanceToNow } from 'date-fns';

const AttendanceList = ({ records = [] }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm transition-colors duration-300">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Attendance</h3>
      <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {records.length} active
      </span>
    </div>
    {records.length === 0 ? (
      <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">No agents are clocked in right now.</p>
    ) : (
      <ul className="mt-4 space-y-3">
        {records.map((record) => (
          <li key={record.id} className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-3 text-sm text-slate-600 dark:text-slate-300 transition-colors duration-300">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                {record.user?.firstName} {record.user?.lastName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clocked in {format(new Date(record.clockIn), 'p')} •{' '}
                {formatDistanceToNow(new Date(record.clockIn), { addSuffix: true })}
              </p>
            </div>
            <div className="text-right text-xs uppercase text-slate-400 dark:text-slate-500">
              {record.shift?.startTime && (
                <p>Shift {format(new Date(record.shift.startTime), 'p')}</p>
              )}
              <p className="font-semibold text-emerald-600">On shift</p>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default AttendanceList;
