import { createUser, deleteUser, getUserById, listUsers, updateUser } from '../services/userService.js';
import { USER_ROLES } from '../utils/constants.js';

export const getUsers = async (req, res) => {
  if (req.user.role === USER_ROLES.EMPLOYEE) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  const result = await listUsers(req.query);
  res.json({ success: true, data: result.data, meta: result.meta });
};

export const getUser = async (req, res) => {
  if (req.user.role === USER_ROLES.EMPLOYEE && req.user.id !== req.params.id) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  const user = await getUserById(req.params.id);
  res.json({ success: true, data: user });
};

export const postUser = async (req, res) => {
  if (req.user.role !== USER_ROLES.ADMIN) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  const user = await createUser(req.body);
  res.status(201).json({ success: true, data: user });
};

export const patchUser = async (req, res) => {
  if (req.user.role !== USER_ROLES.ADMIN) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  const user = await updateUser(req.params.id, req.body);
  res.json({ success: true, data: user });
};

export const removeUser = async (req, res) => {
  if (req.user.role !== USER_ROLES.ADMIN) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  await deleteUser(req.params.id);
  res.status(204).send();
};

export const getProfile = async (req, res) => {
  const user = await getUserById(req.user.id);
  res.json({ success: true, data: user });
};

export const updateProfile = async (req, res) => {
  const { firstName, lastName, password } = req.body;
  const updates = {};
  if (firstName !== undefined) updates.firstName = firstName;
  if (lastName !== undefined) updates.lastName = lastName;
  if (password !== undefined) updates.password = password;

  if (Object.keys(updates).length === 0) {
    const err = new Error('No changes provided');
    err.statusCode = 400;
    throw err;
  }

  const user = await updateUser(req.user.id, updates);
  res.json({ success: true, data: user });
};
