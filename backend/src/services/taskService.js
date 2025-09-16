import { Op } from 'sequelize';
import { Task, Project, User, TimeLog, Team } from '../models/index.js';
import { validate, schemas } from '../utils/validation.js';

const taskIncludes = [
  {
    model: Project,
    as: 'project',
    include: [
      {
        model: Team,
        as: 'team',
        include: [{ model: User, as: 'members', attributes: ['id'], through: { attributes: [] } }]
      }
    ]
  },
  { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
  { model: TimeLog, as: 'timeLogs' }
];

export const listTasks = async (query = {}) => {
  const { projectId, assigneeId, status } = query;
  const where = {};
  if (projectId) where.projectId = projectId;
  if (assigneeId) where.assigneeId = assigneeId;
  if (status) where.status = status;

  return Task.findAll({
    where,
    include: taskIncludes,
    order: [['dueDate', 'ASC']]
  });
};

export const getTaskById = async (id) => {
  const task = await Task.findByPk(id, {
    include: taskIncludes
  });
  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }
  return task;
};

export const createTask = async (payload) => {
  const data = validate(schemas.createTask, payload);
  await Project.findByPk(data.projectId, { rejectOnEmpty: true }).catch(() => {
    const err = new Error('Project not found');
    err.statusCode = 404;
    throw err;
  });

  if (data.assigneeId) {
    const user = await User.findByPk(data.assigneeId);
    if (!user) {
      const err = new Error('Assignee not found');
      err.statusCode = 404;
      throw err;
    }
  }

  return Task.create(data);
};

export const updateTask = async (id, payload) => {
  const data = validate(schemas.updateTask, payload);
  const task = await getTaskById(id);

  if (data.projectId) {
    await Project.findByPk(data.projectId, { rejectOnEmpty: true }).catch(() => {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    });
  }

  if (data.assigneeId) {
    const user = await User.findByPk(data.assigneeId);
    if (!user) {
      const err = new Error('Assignee not found');
      err.statusCode = 404;
      throw err;
    }
  }

  await task.update(data);
  return task;
};

export const deleteTask = async (id) => {
  const task = await getTaskById(id);
  await task.destroy();
  return true;
};

export const assignTasks = async (payload) => {
  const data = validate(schemas.assignTasks, payload);
  const tasks = await Task.findAll({ where: { id: { [Op.in]: data.taskIds } } });
  if (tasks.length !== data.taskIds.length) {
    const err = new Error('Some tasks were not found');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findByPk(data.assigneeId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  await Promise.all(tasks.map((task) => task.update({ assigneeId: user.id })));
  return Task.findAll({ where: { id: { [Op.in]: data.taskIds } }, include: taskIncludes });
};
