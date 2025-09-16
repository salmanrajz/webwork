import { Op } from 'sequelize';
import { Attendance, Shift, User } from '../models/index.js';
import { validate, schemas } from '../utils/validation.js';

export const clockIn = async (userId, payload = {}) => {
  const data = validate(schemas.clockIn, payload);
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  if (data.shiftId) {
    const shift = await Shift.findByPk(data.shiftId);
    if (!shift) {
      const err = new Error('Shift not found');
      err.statusCode = 404;
      throw err;
    }
  }

  const existing = await Attendance.findOne({ where: { userId, clockOut: null } });
  if (existing) {
    return existing;
  }

  return Attendance.create({
    userId,
    shiftId: data.shiftId || null,
    clockIn: data.clockIn || new Date(),
    status: data.status || undefined,
    notes: data.notes || null
  });
};

export const clockOut = async (userId, payload = {}) => {
  const data = validate(schemas.clockOut, payload);
  const attendance = await Attendance.findOne({ where: { userId, clockOut: null } });
  if (!attendance) {
    const err = new Error('No active attendance session');
    err.statusCode = 400;
    throw err;
  }

  await attendance.update({
    clockOut: data.clockOut || new Date(),
    notes: data.notes || attendance.notes
  });
  return attendance;
};

export const getActiveAttendance = async (userId) =>
  Attendance.findOne({
    where: { userId, clockOut: null },
    include: [{ model: Shift, as: 'shift' }],
    order: [['clockIn', 'DESC']]
  });

export const listAttendance = async (query = {}) => {
  const { userId, shiftId, from, to } = query;
  const where = {};
  if (userId) where.userId = userId;
  if (shiftId) where.shiftId = shiftId;
  if (from || to) {
    where.clockIn = {};
    if (from) where.clockIn[Op.gte] = new Date(from);
    if (to) where.clockIn[Op.lte] = new Date(to);
  }

  return Attendance.findAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Shift, as: 'shift' }
    ],
    order: [['clockIn', 'DESC']]
  });
};
