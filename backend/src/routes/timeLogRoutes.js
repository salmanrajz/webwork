import { Router } from 'express';
import {
  getActiveTimer,
  getTimeLog,
  getTimeLogs,
  getTimesheetView,
  patchTimeLog,
  postPauseTimer,
  postResumeTimer,
  postStartTimer,
  postStopTimer,
  postTimeLog,
  removeTimeLog
} from '../controllers/timeLogController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getTimeLogs);
router.post('/', postTimeLog);
router.get('/active', getActiveTimer);
router.get('/timesheet', getTimesheetView);
router.post('/start', postStartTimer);
router.post('/stop', postStopTimer);
router.post('/pause', postPauseTimer);
router.post('/resume', postResumeTimer);
router.get('/:id', getTimeLog);
router.patch('/:id', patchTimeLog);
router.delete('/:id', removeTimeLog);

export default router;
