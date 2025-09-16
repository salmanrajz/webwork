import { Router } from 'express';
import {
  getTask,
  getTasks,
  patchTask,
  postAssignTasks,
  postTask,
  removeTask
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.post('/', postTask);
router.get('/:id', getTask);
router.patch('/:id', patchTask);
router.delete('/:id', removeTask);
router.post('/assign', postAssignTasks);

export default router;
