import { format } from 'date-fns';
import Badge from './Badge.jsx';

const ShiftList = ({ shifts = [] }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-slate-800">Upcoming shifts</h3>
    {shifts.length === 0 ? (
      <p className="mt-4 text-sm text-slate-500">No upcoming shifts scheduled.</p>
    ) : (
      <ul className="mt-4 space-y-3 text-sm text-slate-600">
        {shifts.map((shift) => (
          <li key={shift.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <p className="font-medium text-slate-800">
                {format(new Date(shift.startTime), 'PPpp')} → {format(new Date(shift.endTime), 'pp')}
              </p>
              <p className="text-xs text-slate-500">
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
