import { format } from 'date-fns';
import Badge from './Badge.jsx';

const ShiftList = ({ shifts = [] }) => (
  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm transition-colors duration-300">
    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Upcoming shifts</h3>
    {shifts.length === 0 ? (
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No upcoming shifts scheduled.</p>
    ) : (
      <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
        {shifts.map((shift) => (
          <li key={shift.id} className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-3 transition-colors duration-300">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">
                {format(new Date(shift.startTime), 'PPpp')} → {format(new Date(shift.endTime), 'pp')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {shift.user?.firstName} {shift.user?.lastName}
              </p>
            </div>
            <Badge status={shift.status}>{shift.status.replace('_', ' ')}</Badge>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default ShiftList;
