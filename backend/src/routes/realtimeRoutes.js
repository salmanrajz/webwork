import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getRealtimeOverview, handleRealtimeActivity } from '../controllers/realtimeController.js';

const router = Router();

router.use(authenticate);
router.get('/overview', getRealtimeOverview);
router.post('/activity', handleRealtimeActivity);

export default router;
