import { Op } from 'sequelize';
import { Activity, Task, TimeLog, User } from '../models/index.js';
import { validate, schemas } from '../utils/validation.js';

export const createActivities = async (userId, payload = []) => {
  const activities = validate(schemas.createActivities, payload).map((entry) => ({
    ...entry,
    userId,
    activityScore:
      typeof entry.activityScore === 'number'
        ? entry.activityScore
        : Math.max(0, Math.min(1, entry.durationSeconds - entry.idleSeconds) / entry.durationSeconds)
  }));

  const taskIds = activities.map((a) => a.taskId).filter(Boolean);
  const timeLogIds = activities.map((a) => a.timeLogId).filter(Boolean);

  if (taskIds.length) {
    const tasks = await Task.findAll({ where: { id: { [Op.in]: taskIds } } });
    if (tasks.length !== taskIds.length) {
      const err = new Error('Some tasks were not found');
      err.statusCode = 400;
      throw err;
    }
  }

  if (timeLogIds.length) {
    const logs = await TimeLog.findAll({ where: { id: { [Op.in]: timeLogIds } } });
    if (logs.length !== timeLogIds.length) {
      const err = new Error('Some time logs were not found');
      err.statusCode = 400;
      throw err;
    }
  }

  return Activity.bulkCreate(activities);
};

export const listActivities = async (query = {}) => {
  const { userId, taskId, timeLogId, from, to, limit } = query;
  const where = {};
  if (userId) where.userId = userId;
  if (taskId) where.taskId = taskId;
  if (timeLogId) where.timeLogId = timeLogId;
  if (from || to) {
    where.capturedAt = {};
    if (from) where.capturedAt[Op.gte] = new Date(from);
    if (to) where.capturedAt[Op.lte] = new Date(to);
  }

  const options = {
    where,
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Task, as: 'task', attributes: ['id', 'title'] },
      { model: TimeLog, as: 'timeLog', attributes: ['id', 'startTime', 'endTime'] }
    ],
    order: [['capturedAt', 'DESC']]
  };

  if (limit) {
    const parsedLimit = Number(limit);
    if (Number.isFinite(parsedLimit)) {
      options.limit = parsedLimit;
    }
  }

  return Activity.findAll(options);
};

export const summarizeActivities = async (query = {}) => {
  const { userId, from, to } = query;
  const where = {};
  if (userId) where.userId = userId;
  if (from || to) {
    where.capturedAt = {};
    if (from) where.capturedAt[Op.gte] = new Date(from);
    if (to) where.capturedAt[Op.lte] = new Date(to);
  }

  const activities = await Activity.findAll({ where });
  const totalDurationSeconds = activities.reduce((sum, item) => sum + (item.durationSeconds || 0), 0);
  const idleDurationSeconds = activities.reduce((sum, item) => sum + (item.idleSeconds || 0), 0);
  const totalKeyboardCount = activities.reduce((sum, item) => sum + (item.keyboardCount || 0), 0);
  const totalMouseCount = activities.reduce((sum, item) => sum + (item.mouseCount || 0), 0);

  const score = totalDurationSeconds
    ? Number(((totalDurationSeconds - idleDurationSeconds) / totalDurationSeconds).toFixed(2))
    : 0;

  return {
    totalDurationSeconds,
    idleDurationSeconds,
    totalMinutes: Math.round(totalDurationSeconds / 60),
    idleMinutes: Math.round(idleDurationSeconds / 60),
    productivityScore: score,
    keyboardCount: totalKeyboardCount,
    mouseCount: totalMouseCount
  };
};

export const summarizeActivitiesByApp = async (query = {}) => {
  const { userId, from, to, limit = 10 } = query;
  const where = {};
  if (userId) where.userId = userId;
  if (from || to) {
    where.capturedAt = {};
    if (from) where.capturedAt[Op.gte] = new Date(from);
    if (to) where.capturedAt[Op.lte] = new Date(to);
  }

  const activities = await Activity.findAll({ where });
  const appMap = new Map();

  activities.forEach((activity) => {
    const key = activity.appName || 'Unknown';
    const entry = appMap.get(key) || {
      appName: key,
      totalSeconds: 0,
      idleSeconds: 0,
      samples: 0,
      keyboardCount: 0,
      mouseCount: 0
    };
    entry.totalSeconds += activity.durationSeconds || 0;
    entry.idleSeconds += activity.idleSeconds || 0;
    entry.samples += 1;
    entry.keyboardCount += activity.keyboardCount || 0;
    entry.mouseCount += activity.mouseCount || 0;
    appMap.set(key, entry);
  });

  const sorted = Array.from(appMap.values())
    .map((entry) => ({
      ...entry,
      productiveSeconds: Math.max(entry.totalSeconds - entry.idleSeconds, 0),
      activityScore:
        entry.totalSeconds > 0
          ? Number((Math.max(entry.totalSeconds - entry.idleSeconds, 0) / entry.totalSeconds).toFixed(2))
          : 0
    }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
    .slice(0, Number(limit) || 10);

  return sorted;
};
