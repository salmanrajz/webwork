import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
  getActivities,
  getActivitySummary,
  getActivitySummaryByApp,
  postActivities
} from '../controllers/activityController.js';

const router = Router();

router.use(authenticate);

router.post('/', postActivities);
router.get('/', getActivities);
router.get('/summary', getActivitySummary);
router.get('/summary/apps', getActivitySummaryByApp);

export default router;
