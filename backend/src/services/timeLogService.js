import { Op } from 'sequelize';
import { TimeLog, Task, Project, User } from '../models/index.js';
import { validate, schemas } from '../utils/validation.js';

const includeConfig = [
  {
    model: Task,
    as: 'task',
    include: [{ model: Project, as: 'project' }]
  },
  { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
];

const getPeriodRange = (period, referenceDate = new Date()) => {
  const ref = referenceDate instanceof Date ? referenceDate : new Date(referenceDate);
  const start = new Date(ref);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);

  switch (period) {
    case 'daily':
      end.setDate(start.getDate() + 1);
      break;
    case 'weekly': {
      const day = start.getDay();
      const diff = day === 0 ? -6 : 1 - day; // Monday as start of week
      start.setDate(start.getDate() + diff);
      end.setTime(start.getTime());
      end.setDate(start.getDate() + 7);
      break;
    }
    case 'monthly':
      start.setDate(1);
      end.setMonth(start.getMonth() + 1);
      break;
    default:
      throw Object.assign(new Error('Invalid timesheet period'), { statusCode: 400 });
  }

  return { start, end };
};

export const listTimeLogs = async (query = {}) => {
  const { userId, projectId, startDate, endDate } = query;
  const where = {};
  if (userId) where.userId = userId;
  if (projectId) where['$task.project_id$'] = projectId;
  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime[Op.gte] = new Date(startDate);
    if (endDate) where.startTime[Op.lte] = new Date(endDate);
  }

  return TimeLog.findAll({
    where,
    include: includeConfig,
    order: [['startTime', 'DESC']]
  });
};

export const getTimeLogById = async (id) => {
  const log = await TimeLog.findByPk(id, { include: includeConfig });
  if (!log) {
    const err = new Error('Time log not found');
    err.statusCode = 404;
    throw err;
  }
  return log;
};

export const getActiveTimeLog = async (userId) =>
  TimeLog.findOne({ where: { userId, endTime: null }, include: includeConfig });

export const createTimeLog = async (userId, payload) => {
  const data = validate(schemas.timeLog, payload);

  const task = await Task.findByPk(data.taskId, {
    include: [{ model: Project, as: 'project' }]
  });

  if (!task) {
    const err = new Error('Task not found');
    err.statusCode = 404;
    throw err;
  }

  const log = await TimeLog.create({
    ...data,
    userId,
    durationMinutes: data.endTime ? 0 : undefined
  });

  return getTimeLogById(log.id);
};

export const updateTimeLog = async (id, userId, payload) => {
  const data = validate(schemas.updateTimeLog, payload);
  const log = await getTimeLogById(id);
  if (log.userId !== userId) {
    const err = new Error('You can only update your own time logs');
    err.statusCode = 403;
    throw err;
  }

  await log.update(data);
  return getTimeLogById(log.id);
};

export const deleteTimeLog = async (id, userId) => {
  const log = await getTimeLogById(id);
  if (log.userId !== userId) {
    const err = new Error('You can only delete your own time logs');
    err.statusCode = 403;
    throw err;
  }
  await log.destroy();
  return true;
};

export const startTimer = async (userId, payload) => {
  const { taskId, note } = payload;
  if (!taskId) {
    const err = new Error('taskId is required to start a timer');
    err.statusCode = 400;
    throw err;
  }

  const active = await getActiveTimeLog(userId);
  if (active) {
    const err = new Error('Active timer already running');
    err.statusCode = 400;
    throw err;
  }

  return createTimeLog(userId, {
    taskId,
    startTime: new Date(),
    note: note || 'Started via timer'
  });
};

export const stopTimer = async (userId) => {
  const active = await getActiveTimeLog(userId);
  if (!active) {
    const err = new Error('No active timer');
    err.statusCode = 400;
    throw err;
  }

  await active.update({ endTime: new Date() });
  return getTimeLogById(active.id);
};

export const pauseTimer = async (userId) => {
  const active = await getActiveTimeLog(userId);
  if (!active) {
    const err = new Error('No active timer to pause');
    err.statusCode = 400;
    throw err;
  }

  await active.update({ endTime: new Date(), isManual: true, note: active.note || 'Paused timer' });
  return getTimeLogById(active.id);
};

export const resumeTimer = async (userId, payload) => {
  const { taskId } = payload;
  if (!taskId) {
    const err = new Error('taskId is required to resume a timer');
    err.statusCode = 400;
    throw err;
  }

  const active = await getActiveTimeLog(userId);
  if (active) {
    const err = new Error('Active timer already running');
    err.statusCode = 400;
    throw err;
  }

  return createTimeLog(userId, {
    taskId,
    startTime: new Date(),
    note: 'Resumed timer'
  });
};

export const getTimesheet = async (userId, { period = 'weekly', referenceDate } = {}) => {
  const { start, end } = getPeriodRange(period, referenceDate);

  const logs = await TimeLog.findAll({
    where: {
      userId,
      startTime: { [Op.between]: [start, end] }
    },
    include: includeConfig,
    order: [['startTime', 'ASC']]
  });

  const totalsByDay = new Map();
  logs.forEach((log) => {
    const key = log.startTime.toISOString().slice(0, 10);
    const prev = totalsByDay.get(key) || 0;
    totalsByDay.set(key, prev + (log.durationMinutes || 0));
  });

  return {
    period,
    startDate: start.toISOString(),
    endDate: new Date(end.getTime() - 1).toISOString(),
    totalMinutes: logs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0),
    totalsByDay: Array.from(totalsByDay.entries()).map(([date, minutes]) => ({ date, minutes })),
    logs
  };
};
