import { formatDistanceToNow } from 'date-fns';

const statusStyles = {
  online: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
  non_productive: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',
  idle: 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300',
  absent: 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300'
};

const RealTimeBoard = ({ snapshot }) => {
  if (!snapshot) return null;
  const summary = snapshot.summary || {
    totalMembers: 0,
    workingNow: 0,
    nonProductive: 0,
    absent: 0
  };
  const members = snapshot.members || [];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm transition-colors duration-300">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-700 p-4 transition-colors duration-300">
          <p className="text-xs uppercase text-slate-400 dark:text-slate-500">Members</p>
          <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">{summary.totalMembers}</p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-700 p-4 transition-colors duration-300">
          <p className="text-xs uppercase text-slate-400 dark:text-slate-500">Working now</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{summary.workingNow}</p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-700 p-4 transition-colors duration-300">
          <p className="text-xs uppercase text-slate-400 dark:text-slate-500">Non-productive</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600">{summary.nonProductive}</p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-700 p-4 transition-colors duration-300">
          <p className="text-xs uppercase text-slate-400 dark:text-slate-500">Absent</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600">{summary.absent}</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 transition-colors duration-300">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-600 text-sm">
          <thead className="bg-slate-50 dark:bg-slate-700 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 transition-colors duration-300">
            <tr>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">App / Website</th>
              <th className="px-4 py-3">Keys / Mouse</th>
              <th className="px-4 py-3">Last Activity</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-600">
            {members.map((member) => (
              <tr key={member.id} className="text-slate-600 dark:text-slate-300 transition-colors duration-300">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800 dark:text-slate-100">
                    {member.firstName} {member.lastName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{member.email}</div>
                </td>
                <td className="px-4 py-3">{member.project || '—'}</td>
                <td className="px-4 py-3">{member.task || '—'}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-700 dark:text-slate-200">{member.appName || '—'}</div>
                  {member.windowTitle && (
                    <div className="text-xs text-slate-400 dark:text-slate-500">{member.windowTitle}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                  {member.keyboardCount ?? 0} / {member.mouseCount ?? 0}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500">
                  {member.capturedAt
                    ? formatDistanceToNow(new Date(member.capturedAt), { addSuffix: true })
                    : 'No data'}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[member.status] || 'bg-slate-200 text-slate-700'}`}>
                    {member.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RealTimeBoard;
