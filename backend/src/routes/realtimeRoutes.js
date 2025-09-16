import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getRealtimeOverview } from '../controllers/realtimeController.js';

const router = Router();

router.use(authenticate);
router.get('/overview', getRealtimeOverview);

export default router;
