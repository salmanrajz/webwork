import {
  createActivities,
  listActivities,
  summarizeActivities,
  summarizeActivitiesByApp
} from '../services/activityService.js';
import { USER_ROLES } from '../utils/constants.js';

const canManageAllActivities = (role) => role === USER_ROLES.ADMIN || role === USER_ROLES.MANAGER;

export const postActivities = async (req, res) => {
  const activities = await createActivities(req.user.id, req.body.activities || req.body);
  res.status(201).json({ success: true, data: activities });
};

export const getActivities = async (req, res) => {
  const query = { ...req.query };
  if (!canManageAllActivities(req.user.role)) {
    query.userId = req.user.id;
  }
  const activities = await listActivities(query);
  res.json({ success: true, data: activities });
};

export const getActivitySummary = async (req, res) => {
  const query = { ...req.query };
  if (!canManageAllActivities(req.user.role)) {
    query.userId = req.user.id;
  }
  const summary = await summarizeActivities(query);
  res.json({ success: true, data: summary });
};

export const getActivitySummaryByApp = async (req, res) => {
  const query = { ...req.query };
  if (!canManageAllActivities(req.user.role)) {
    query.userId = req.user.id;
  }
  const summary = await summarizeActivitiesByApp(query);
  res.json({ success: true, data: summary });
};
