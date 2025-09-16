import {
  deleteScreenshot,
  getScreenshotById,
  listScreenshots,
  uploadScreenshot
} from '../services/screenshotService.js';
import { USER_ROLES } from '../utils/constants.js';

const canManageAllScreenshots = (role) => role === USER_ROLES.ADMIN || role === USER_ROLES.MANAGER;
const ensureAdmin = (role) => {
  if (role !== USER_ROLES.ADMIN) {
    const err = new Error('Only administrators can perform this action');
    err.statusCode = 403;
    throw err;
  }
};

export const getScreenshots = async (req, res) => {
  const query = { ...req.query };
  if (!canManageAllScreenshots(req.user.role)) {
    query.userId = req.user.id;
  }
  const screenshots = await listScreenshots(query);
  res.json({ success: true, data: screenshots });
};

export const getScreenshot = async (req, res) => {
  const screenshot = await getScreenshotById(req.params.id);
  if (!canManageAllScreenshots(req.user.role) && screenshot.userId !== req.user.id) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }
  res.json({ success: true, data: screenshot });
};

export const postScreenshot = async (req, res) => {
  const screenshot = await uploadScreenshot(req.user.id, req.file, req.body);
  res.status(201).json({ success: true, data: screenshot });
};

export const removeScreenshot = async (req, res) => {
  ensureAdmin(req.user.role);
  const screenshot = await getScreenshotById(req.params.id);
  await deleteScreenshot(req.params.id);
  res.status(204).send();
};
