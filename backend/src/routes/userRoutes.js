import { Router } from 'express';
import {
  getProfile,
  getUser,
  getUsers,
  postUser,
  removeUser,
  updateProfile,
  patchUser
} from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/me', getProfile);
router.patch('/me', updateProfile);

router.get('/', getUsers);
router.post('/', postUser);
router.get('/:id', getUser);
router.patch('/:id', patchUser);
router.delete('/:id', removeUser);

export default router;
