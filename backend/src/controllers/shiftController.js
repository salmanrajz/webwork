import { createShift, deleteShift, listShifts, updateShift } from '../services/shiftService.js';
import { USER_ROLES } from '../utils/constants.js';

const ensureAdmin = (role) => {
  if (role !== USER_ROLES.ADMIN) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
};

export const getShifts = async (req, res) => {
  const query = { ...req.query };
  if (req.user.role !== USER_ROLES.ADMIN && req.user.role !== USER_ROLES.MANAGER) {
    query.userId = req.user.id;
  }
  const shifts = await listShifts(query);
  res.json({ success: true, data: shifts });
};

export const postShift = async (req, res) => {
  ensureAdmin(req.user.role);
  const shift = await createShift(req.body);
  res.status(201).json({ success: true, data: shift });
};

export const patchShift = async (req, res) => {
  ensureAdmin(req.user.role);
  const shift = await updateShift(req.params.id, req.body);
  res.json({ success: true, data: shift });
};

export const removeShift = async (req, res) => {
  ensureAdmin(req.user.role);
  await deleteShift(req.params.id);
  res.status(204).send();
};
