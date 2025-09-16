import { clockIn, clockOut, getActiveAttendance, listAttendance } from '../services/attendanceService.js';
import { USER_ROLES } from '../utils/constants.js';

const canViewAll = (role) => role === USER_ROLES.ADMIN || role === USER_ROLES.MANAGER;

export const postClockIn = async (req, res) => {
  const record = await clockIn(req.user.id, req.body);
  res.status(201).json({ success: true, data: record });
};

export const postClockOut = async (req, res) => {
  const record = await clockOut(req.user.id, req.body);
  res.json({ success: true, data: record });
};

export const getActive = async (req, res) => {
  const record = await getActiveAttendance(req.user.id);
  res.json({ success: true, data: record });
};

export const getAttendance = async (req, res) => {
  const query = { ...req.query };
  if (!canViewAll(req.user.role)) {
    query.userId = req.user.id;
  }
  const records = await listAttendance(query);
  res.json({ success: true, data: records });
};
