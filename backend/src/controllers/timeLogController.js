import {
  createTimeLog,
  deleteTimeLog,
  getActiveTimeLog,
  getTimeLogById,
  getTimesheet,
  listTimeLogs,
  pauseTimer,
  resumeTimer,
  startTimer,
  stopTimer,
  updateTimeLog
} from '../services/timeLogService.js';
import { USER_ROLES } from '../utils/constants.js';

const canManageAllLogs = (role) => role === USER_ROLES.ADMIN || role === USER_ROLES.MANAGER;

export const getTimeLogs = async (req, res) => {
  const query = { ...req.query };
  if (!canManageAllLogs(req.user.role)) {
    query.userId = req.user.id;
  }
  const logs = await listTimeLogs(query);
  res.json({ success: true, data: logs });
};

export const getTimeLog = async (req, res) => {
  const log = await getTimeLogById(req.params.id);
  if (!canManageAllLogs(req.user.role) && log.userId !== req.user.id) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  res.json({ success: true, data: log });
};

export const postTimeLog = async (req, res) => {
  const log = await createTimeLog(req.user.id, req.body);
  res.status(201).json({ success: true, data: log });
};

export const patchTimeLog = async (req, res) => {
  const log = await getTimeLogById(req.params.id);
  if (!canManageAllLogs(req.user.role) && log.userId !== req.user.id) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  const updated = await updateTimeLog(req.params.id, log.userId, req.body);
  res.json({ success: true, data: updated });
};

export const removeTimeLog = async (req, res) => {
  const log = await getTimeLogById(req.params.id);
  if (!canManageAllLogs(req.user.role) && log.userId !== req.user.id) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  await deleteTimeLog(req.params.id, log.userId);
  res.status(204).send();
};

export const postStartTimer = async (req, res) => {
  const log = await startTimer(req.user.id, req.body);
  res.status(201).json({ success: true, data: log });
};

export const postStopTimer = async (req, res) => {
  const log = await stopTimer(req.user.id);
  res.json({ success: true, data: log });
};

export const postPauseTimer = async (req, res) => {
  const log = await pauseTimer(req.user.id);
  res.json({ success: true, data: log });
};

export const postResumeTimer = async (req, res) => {
  const log = await resumeTimer(req.user.id, req.body);
  res.status(201).json({ success: true, data: log });
};

export const getActiveTimer = async (req, res) => {
  const log = await getActiveTimeLog(req.user.id);
  res.json({ success: true, data: log });
};

export const getTimesheetView = async (req, res) => {
  const period = req.query.period || 'weekly';
  const targetUserId = req.query.userId || req.user.id;
  if (req.user.role === USER_ROLES.EMPLOYEE && targetUserId !== req.user.id) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const timesheet = await getTimesheet(targetUserId, {
    period,
    referenceDate: req.query.date
  });
  res.json({ success: true, data: timesheet });
};
