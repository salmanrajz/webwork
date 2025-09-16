import { format, formatDistanceToNow } from 'date-fns';

const AttendanceList = ({ records = [] }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-slate-800">Attendance</h3>
      <span className="text-xs uppercase tracking-wide text-slate-400">
        {records.length} active
      </span>
    </div>
    {records.length === 0 ? (
      <p className="mt-6 text-sm text-slate-500">No agents are clocked in right now.</p>
    ) : (
      <ul className="mt-4 space-y-3">
        {records.map((record) => (
          <li key={record.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-800">
                {record.user?.firstName} {record.user?.lastName}
              </p>
              <p className="text-xs text-slate-500">
                Clocked in {format(new Date(record.clockIn), 'p')} •{' '}
                {formatDistanceToNow(new Date(record.clockIn), { addSuffix: true })}
              </p>
            </div>
            <div className="text-right text-xs uppercase text-slate-400">
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
