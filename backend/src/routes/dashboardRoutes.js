import { Router } from 'express';
import { getAdminDashboard } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);
router.get('/admin', getAdminDashboard);

export default router;
