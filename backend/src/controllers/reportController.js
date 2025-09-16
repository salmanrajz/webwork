import { projectReport, userReport } from '../services/reportService.js';
import { USER_ROLES } from '../utils/constants.js';

export const getUserReport = async (req, res) => {
  const { id } = req.params;
  if (req.user.role === USER_ROLES.EMPLOYEE && req.user.id !== id) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const report = await userReport({
    userId: id,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  });
  res.json({ success: true, data: report });
};

export const getProjectReport = async (req, res) => {
  const { id } = req.params;
  if (req.user.role === USER_ROLES.EMPLOYEE) {
    const err = new Error('Forbidden');
    err.statusCode = 403;
    throw err;
  }

  const report = await projectReport({
    projectId: id,
    startDate: req.query.startDate,
    endDate: req.query.endDate
  });
  res.json({ success: true, data: report });
};
