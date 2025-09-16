import { Router } from 'express';
import { getProjectReport, getUserReport } from '../controllers/reportController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/users/:id', getUserReport);
router.get('/projects/:id', getProjectReport);

export default router;
