import { useEffect, useState } from 'react';
import Button from './Button.jsx';
import Loader from './Loader.jsx';
import { taskApi, projectApi, userApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const defaultForm = {
  id: null,
  title: '',
  description: '',
  projectId: '',
  assigneeId: '',
  status: 'todo',
  estimatedHours: '',
  dueDate: ''
};

const TaskModal = ({ open, onClose, onSaved, editingTask }) => {
  const { user } = useAuth();
  const isEdit = Boolean(editingTask);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    const loadLists = async () => {
      try {
        const [projectData, userData] = await Promise.all([
          projectApi.list(),
          user.role !== 'employee' ? userApi.list({ limit: 100 }) : Promise.resolve({ users: [] })
        ]);
        setProjects(projectData || []);
        setUsers(userData.users || []);
      } catch (err) {
        console.error('Failed to load reference data', err);
      }
    };

    loadLists();
  }, [open, user.role]);

  useEffect(() => {
    if (editingTask) {
      setForm({
        id: editingTask.id,
        title: editingTask.title || '',
        description: editingTask.description || '',
        projectId: editingTask.projectId || '',
        assigneeId: editingTask.assigneeId || '',
        status: editingTask.status || 'todo',
        estimatedHours: editingTask.estimatedHours || '',
        dueDate: editingTask.dueDate || ''
      });
    } else {
      setForm(defaultForm);
    }
  }, [editingTask, open]);

  if (!open) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        projectId: form.projectId || null,
        assigneeId: form.assigneeId || null,
        status: form.status,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null,
        dueDate: form.dueDate || null
      };
      if (isEdit && form.id) {
        await taskApi.update(form.id, payload);
      } else {
        await taskApi.create(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">{isEdit ? 'Edit task' : 'Create task'}</h3>
          <button type="button" onClick={onClose} className="text-sm text-slate-400 transition hover:text-slate-600">
            Esc
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-600">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-600">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Project</label>
            <select
              name="projectId"
              value={form.projectId}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Unassigned</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Assignee</label>
            <select
              name="assigneeId"
              value={form.assigneeId}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">Unassigned</option>
              {users.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.firstName} {agent.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Estimate (hours)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              name="estimatedHours"
              value={form.estimatedHours}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600">Due date</label>
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error.response?.data?.message || error.message}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaskModal;
