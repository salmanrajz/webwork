import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import teamRoutes from './teamRoutes.js';
import projectRoutes from './projectRoutes.js';
import taskRoutes from './taskRoutes.js';
import timeLogRoutes from './timeLogRoutes.js';
import reportRoutes from './reportRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import screenshotRoutes from './screenshotRoutes.js';
import activityRoutes from './activityRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import shiftRoutes from './shiftRoutes.js';
import realtimeRoutes from './realtimeRoutes.js';
import restrictionRoutes from './restrictionRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/teams', teamRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/timelogs', timeLogRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/screenshots', screenshotRoutes);
router.use('/activities', activityRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/shifts', shiftRoutes);
router.use('/realtime', realtimeRoutes);
router.use('/restrictions', restrictionRoutes);

export default router;
