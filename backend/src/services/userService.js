import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User, Team } from '../models/index.js';
import { validate, schemas } from '../utils/validation.js';

export const listUsers = async (query = {}) => {
  const { page = 1, limit = 25, search } = query;
  const offset = (page - 1) * limit;

  const where = {};
  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [{ model: Team, as: 'teams', through: { attributes: ['role'] } }],
    limit: Number(limit),
    offset
  });

  return {
    data: rows,
    meta: {
      total: count,
      page: Number(page),
      pages: Math.ceil(count / limit) || 1
    }
  };
};

export const getUserById = async (id) => {
  const user = await User.findByPk(id, {
    include: [{ model: Team, as: 'teams', through: { attributes: ['role'] } }]
  });
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

export const createUser = async (payload) => {
  const data = validate(schemas.register, payload);
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  return User.create({
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: data.role,
    passwordHash
  });
};

export const updateUser = async (id, payload) => {
  const data = validate(schemas.updateUser, payload);
  const user = await getUserById(id);

  if (data.password) {
    data.passwordHash = await bcrypt.hash(data.password, 10);
    delete data.password;
  }

  await user.update(data);
  return user;
};

export const deleteUser = async (id) => {
  const user = await getUserById(id);
  await user.destroy();
  return true;
};
