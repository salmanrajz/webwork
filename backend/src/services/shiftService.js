import { Op } from 'sequelize';
import { Shift, User } from '../models/index.js';
import { validate, schemas } from '../utils/validation.js';

export const createShift = async (payload) => {
  const data = validate(schemas.createShift, payload);
  const user = await User.findByPk(data.userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return Shift.create(data);
};

export const updateShift = async (id, payload) => {
  const data = validate(schemas.updateShift, payload);
  const shift = await Shift.findByPk(id);
  if (!shift) {
    const err = new Error('Shift not found');
    err.statusCode = 404;
    throw err;
  }
  await shift.update(data);
  return shift;
};

export const deleteShift = async (id) => {
  const shift = await Shift.findByPk(id);
  if (!shift) {
    const err = new Error('Shift not found');
    err.statusCode = 404;
    throw err;
  }
  await shift.destroy();
  return true;
};

export const listShifts = async (query = {}) => {
  const { userId, status, from, to, limit } = query;
  const where = {};
  if (userId) where.userId = userId;
  if (status) where.status = status;
  if (from || to) {
    where.startTime = {};
    if (from) where.startTime[Op.gte] = new Date(from);
    if (to) where.startTime[Op.lte] = new Date(to);
  }

  const options = {
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    order: [['startTime', 'ASC']]
  };

  if (limit) {
    const parsedLimit = Number(limit);
    if (Number.isFinite(parsedLimit)) {
      options.limit = parsedLimit;
    }
  }

  return Shift.findAll(options);
};
