import { Op } from 'sequelize';
import { TimeLog, Task, Project, User } from '../models/index.js';

const buildWhereClause = ({ userId, projectId, startDate, endDate }) => {
  const where = {};
  if (userId) where.userId = userId;
  if (projectId) where['$task.project_id$'] = projectId;
  if (startDate || endDate) {
    where.startTime = {};
    if (startDate) where.startTime[Op.gte] = new Date(startDate);
    if (endDate) where.startTime[Op.lte] = new Date(endDate);
  }
  return where;
};

const includeConfig = [
  {
    model: Task,
    as: 'task',
    include: [{ model: Project, as: 'project' }]
  },
  { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }
];

const aggregateByKey = (items, selectKey, selectName) => {
  const map = new Map();
  items.forEach((item) => {
    const key = selectKey(item);
    if (!key) return;
    const prev = map.get(key) || { key, name: selectName(item), minutes: 0 };
    prev.minutes += item.durationMinutes || 0;
    map.set(key, prev);
  });
  return Array.from(map.values());
};

export const userReport = async ({ userId, startDate, endDate }) => {
  const logs = await TimeLog.findAll({
    where: buildWhereClause({ userId, startDate, endDate }),
    include: includeConfig,
    order: [['startTime', 'ASC']]
  });

  const totalMinutes = logs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);

  const totalsByDayMap = new Map();
  logs.forEach((log) => {
    const dateKey = log.startTime.toISOString().slice(0, 10);
    const prev = totalsByDayMap.get(dateKey) || 0;
    totalsByDayMap.set(dateKey, prev + (log.durationMinutes || 0));
  });

  const totalsByProject = aggregateByKey(
    logs,
    (log) => log.task?.project?.id,
    (log) => log.task?.project?.name
  );

  return {
    totalMinutes,
    totalsByDay: Array.from(totalsByDayMap.entries()).map(([date, minutes]) => ({ date, minutes })),
    totalsByProject
  };
};

export const projectReport = async ({ projectId, startDate, endDate }) => {
  const logs = await TimeLog.findAll({
    where: buildWhereClause({ projectId, startDate, endDate }),
    include: includeConfig,
    order: [['startTime', 'ASC']]
  });

  const totalMinutes = logs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);

  const totalsByUser = aggregateByKey(
    logs,
    (log) => log.user?.id,
    (log) => `${log.user?.firstName || ''} ${log.user?.lastName || ''}`.trim()
  );

  const totalsByTask = aggregateByKey(
    logs,
    (log) => log.task?.id,
    (log) => log.task?.title
  );

  return {
    totalMinutes,
    totalsByUser,
    totalsByTask
  };
};
