import {
  assignTasks,
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask
} from '../services/taskService.js';
import { USER_ROLES } from '../utils/constants.js';

const ensureManagerOrAdmin = (role) => {
  if (![USER_ROLES.ADMIN, USER_ROLES.MANAGER].includes(role)) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
};

const taskAccessibleByEmployee = (task, userId) => {
  const members = task.project?.team?.members || [];
  return task.assignee?.id === userId || members.some((member) => member.id === userId);
};

const filterTasksForEmployee = (tasks, userId) =>
  tasks.filter((task) => taskAccessibleByEmployee(task, userId));

export const getTasks = async (req, res) => {
  const tasks = await listTasks(req.query);
  const data =
    req.user.role === USER_ROLES.EMPLOYEE ? filterTasksForEmployee(tasks, req.user.id) : tasks;
  res.json({ success: true, data });
};

export const getTask = async (req, res) => {
  const task = await getTaskById(req.params.id);
  if (req.user.role === USER_ROLES.EMPLOYEE && !taskAccessibleByEmployee(task, req.user.id)) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  res.json({ success: true, data: task });
};

export const postTask = async (req, res) => {
  ensureManagerOrAdmin(req.user.role);
  const task = await createTask(req.body);
  res.status(201).json({ success: true, data: task });
};

export const patchTask = async (req, res) => {
  if (req.user.role === USER_ROLES.EMPLOYEE) {
    const task = await getTaskById(req.params.id);
    if (!taskAccessibleByEmployee(task, req.user.id)) {
      const err = new Error('Forbidden');
      err.statusCode = 403;
      throw err;
    }
    const updates = {};
    if ('status' in req.body) updates.status = req.body.status;
    if ('estimatedHours' in req.body) updates.estimatedHours = req.body.estimatedHours;
    if ('dueDate' in req.body) updates.dueDate = req.body.dueDate;
    if (Object.keys(updates).length === 0) {
      const err = new Error('No allowed fields to update');
      err.statusCode = 400;
      throw err;
    }
    const updated = await updateTask(req.params.id, updates);
    res.json({ success: true, data: updated });
    return;
  }

  const task = await updateTask(req.params.id, req.body);
  res.json({ success: true, data: task });
};

export const removeTask = async (req, res) => {
  ensureManagerOrAdmin(req.user.role);
  await deleteTask(req.params.id);
  res.status(204).send();
};

export const postAssignTasks = async (req, res) => {
  ensureManagerOrAdmin(req.user.role);
  const tasks = await assignTasks(req.body);
  res.json({ success: true, data: tasks });
};
