import { useEffect, useState } from 'react';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import Topbar from '../components/Topbar.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import { taskApi, userApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const AssignTasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [assigneeId, setAssigneeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const canAssign = user.role !== 'employee';

  useEffect(() => {
    if (!canAssign) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [taskData, userData] = await Promise.all([
          taskApi.list({ status: 'todo' }),
          userApi.list({ limit: 100 })
        ]);
        setTasks(taskData);
        setUsers(userData.users || []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canAssign]);

  const toggleSelection = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleAssign = async () => {
    if (!assigneeId || selected.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await taskApi.assign({ taskIds: selected, assigneeId });
      const refreshed = await taskApi.list({ status: 'todo' });
      setTasks(refreshed);
      setSelected([]);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  if (!canAssign) {
    return (
      <DashboardLayout topbar={<Topbar title="Assign tasks" />}>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-700">
          Only managers or admins can assign tasks.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout topbar={<Topbar title="Assign tasks" />}>
      {loading ? (
        <Loader message="Loading tasks" />
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Failed to load tasks. {error.response?.data?.message || error.message}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Select assignee</option>
              {users.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.firstName} {agent.lastName} ({agent.role})
                </option>
              ))}
            </select>
            <Button onClick={handleAssign} disabled={!assigneeId || selected.length === 0 || saving}>
              {saving ? 'Assigning...' : 'Assign selected'}
            </Button>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                      checked={selected.length > 0 && selected.length === tasks.length}
                      onChange={(event) =>
                        setSelected(event.target.checked ? tasks.map((task) => task.id) : [])
                      }
                    />
                  </th>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Current assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <tr key={task.id} className="text-slate-600">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(task.id)}
                        onChange={() => toggleSelection(task.id)}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{task.title}</div>
                      <div className="text-xs text-slate-500">{task.description}</div>
                    </td>
                    <td className="px-4 py-3">{task.project?.name || '—'}</td>
                    <td className="px-4 py-3">
                      {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AssignTasksPage;
