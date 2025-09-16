import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Op } from 'sequelize';
import { Screenshot, Task, TimeLog, User } from '../models/index.js';
import { validate, schemas } from '../utils/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadRoot = path.resolve(__dirname, '..', '..', 'uploads', 'screenshots');

const ensureUploadDirectory = () => {
  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
  }
};

export const listScreenshots = async (query = {}) => {
  const filters = validate(schemas.filterScreenshots, query);
  const where = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.taskId) where.taskId = filters.taskId;
  if (filters.from || filters.to) {
    where.capturedAt = {};
    if (filters.from) where.capturedAt[Op.gte] = new Date(filters.from);
    if (filters.to) where.capturedAt[Op.lte] = new Date(filters.to);
  }

  return Screenshot.findAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Task, as: 'task', attributes: ['id', 'title'] },
      { model: TimeLog, as: 'timeLog', attributes: ['id', 'startTime', 'endTime'] }
    ],
    order: [['capturedAt', 'DESC']]
  });
};

export const getScreenshotById = async (id) => {
  const screenshot = await Screenshot.findByPk(id, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] },
      { model: Task, as: 'task', attributes: ['id', 'title'] },
      { model: TimeLog, as: 'timeLog', attributes: ['id', 'startTime', 'endTime'] }
    ]
  });
  if (!screenshot) {
    const err = new Error('Screenshot not found');
    err.statusCode = 404;
    throw err;
  }
  return screenshot;
};

export const uploadScreenshot = async (userId, file, payload = {}) => {
  if (!file) {
    const err = new Error('Screenshot file is required');
    err.statusCode = 400;
    throw err;
  }

  ensureUploadDirectory();
  const data = validate(schemas.createScreenshot, payload);

  const filename = `${Date.now()}-${file.originalname}`;
  const relativePath = path.join('screenshots', filename);
  const destination = path.join(uploadRoot, filename);

  if (data.taskId) {
    const task = await Task.findByPk(data.taskId);
    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      throw err;
    }
  }

  if (data.timeLogId) {
    const log = await TimeLog.findByPk(data.timeLogId);
    if (!log) {
      const err = new Error('Time log not found');
      err.statusCode = 404;
      throw err;
    }
  }

  fs.writeFileSync(destination, file.buffer);

  const screenshot = await Screenshot.create({
    userId,
    taskId: data.taskId || null,
    timeLogId: data.timeLogId || null,
    note: data.note,
    capturedAt: data.capturedAt || new Date(),
    imagePath: relativePath
  });

  return getScreenshotById(screenshot.id);
};

export const deleteScreenshot = async (id) => {
  const screenshot = await getScreenshotById(id);
  const filePath = path.join(__dirname, '..', '..', 'uploads', screenshot.imagePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  await screenshot.destroy();
  return true;
};
