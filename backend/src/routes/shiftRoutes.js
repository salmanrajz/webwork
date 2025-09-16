import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getShifts, patchShift, postShift, removeShift } from '../controllers/shiftController.js';

const router = Router();

router.use(authenticate);

router.get('/', getShifts);
router.post('/', postShift);
router.patch('/:id', patchShift);
router.delete('/:id', removeShift);

export default router;
