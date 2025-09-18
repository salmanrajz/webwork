import { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button.jsx';
import Loader from '../components/Loader.jsx';
import Badge from '../components/Badge.jsx';
import Topbar from '../components/Topbar.jsx';
import DashboardLayout from '../layouts/DashboardLayout.jsx';
import TaskModal from '../components/TaskModal.jsx';
import { taskApi, projectApi, userApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const statusLabel = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
  blocked: 'Blocked'
};

const TasksPage = () => {
  const { user } = useAuth();
  const canManage = useMemo(() => user.role !== 'employee', [user.role]);
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: '', assigneeId: '', projectId: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [taskData, userData, projectData] = await Promise.all([
          taskApi.list(),
          canManage ? userApi.list({ limit: 100 }) : Promise.resolve({ users: [] }),
          projectApi.list()
        ]);
        setTasks(taskData);
        setUsers(userData.users || []);
        setProjects(projectData || []);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canManage]);

  const filteredTasks = tasks.filter((task) => {
    if (filters.status && task.status !== filters.status) return false;
    if (filters.assigneeId && task.assigneeId !== filters.assigneeId) return false;
    if (filters.projectId && task.projectId !== filters.projectId) return false;
    return true;
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskApi.remove(id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  return (
    <DashboardLayout topbar={<Topbar title="Tasks" />}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              className="rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300"
            >
              <option value="">All statuses</option>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
            {canManage && (
              <select
                value={filters.assigneeId}
                onChange={(event) => setFilters((prev) => ({ ...prev, assigneeId: event.target.value }))}
                className="rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300"
              >
                <option value="">All assignees</option>
                {users.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.firstName} {agent.lastName}
                  </option>
                ))}
              </select>
            )}
            <select
              value={filters.projectId}
              onChange={(event) => setFilters((prev) => ({ ...prev, projectId: event.target.value }))}
              className="rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors duration-300"
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          {canManage && (
            <Button
              onClick={() => {
                setEditingTask(null);
                setModalOpen(true);
              }}
            >
              Create task
            </Button>
          )}
        </div>

        {loading ? (
          <Loader message="Loading tasks" />
        ) : error ? (
          <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-6 text-rose-700 dark:text-rose-300 transition-colors duration-300">
            Failed to load tasks. {error.response?.data?.message || error.message}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTasks.map((task) => (
              <div key={task.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm transition-colors duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.project?.name || 'No project'}</p>
                  </div>
                  <Badge status={task.status}>{statusLabel[task.status] || task.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{task.description || 'No description provided.'}</p>

                <div className="mt-4 space-y-1 text-xs text-slate-400 dark:text-slate-500">
                  <p>Assignee: {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : 'Unassigned'}</p>
                  {task.dueDate && <p>Due {task.dueDate}</p>}
                  {task.estimatedHours && <p>Estimate {task.estimatedHours} h</p>}
                </div>

                {canManage && (
                  <div className="mt-4 flex items-center justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTask(task);
                        setModalOpen(true);
                      }}
                      className="rounded-full border border-slate-200 dark:border-slate-600 px-3 py-1 font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      className="rounded-full border border-rose-200 dark:border-rose-800 px-3 py-1 font-semibold text-rose-600 dark:text-rose-400 transition hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-10 text-center text-sm text-slate-500 dark:text-slate-400 transition-colors duration-300">
                No tasks match the current filters.
              </div>
            )}
          </div>
        )}
      </div>
      {canManage && (
        <TaskModal
          open={modalOpen}
          editingTask={editingTask}
          onClose={() => setModalOpen(false)}
          onSaved={async () => {
            const updated = await taskApi.list();
            setTasks(updated);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default TasksPage;
