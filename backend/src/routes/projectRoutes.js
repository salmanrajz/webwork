import { Router } from 'express';
import {
  getProject,
  getProjects,
  patchProject,
  postProject,
  removeProject
} from '../controllers/projectController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.post('/', postProject);
router.get('/:id', getProject);
router.patch('/:id', patchProject);
router.delete('/:id', removeProject);

export default router;
