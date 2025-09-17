import { Router } from 'express';
import {
  getProfile,
  getUser,
  getUsers,
  postUser,
  removeUser,
  updateProfile,
  patchUser,
  getBreakSettings,
  updateBreakSettings
} from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/me', getProfile);
router.patch('/me', updateProfile);

// Break settings endpoints
router.get('/me/break-settings', getBreakSettings);
router.patch('/me/break-settings', updateBreakSettings);

router.get('/', getUsers);
router.post('/', postUser);
router.get('/:id', getUser);
router.patch('/:id', patchUser);
router.delete('/:id', removeUser);

export default router;
