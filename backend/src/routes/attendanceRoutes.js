import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getActive, getAttendance, postClockIn, postClockOut } from '../controllers/attendanceController.js';

const router = Router();

router.use(authenticate);

router.post('/clock-in', postClockIn);
router.post('/clock-out', postClockOut);
router.get('/active', getActive);
router.get('/', getAttendance);

export default router;
