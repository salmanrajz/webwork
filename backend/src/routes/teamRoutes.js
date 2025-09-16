import { Router } from 'express';
import {
  getTeam,
  getTeams,
  patchTeam,
  postTeam,
  postTeamMembers,
  removeTeam
} from '../controllers/teamController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getTeams);
router.post('/', postTeam);
router.get('/:id', getTeam);
router.patch('/:id', patchTeam);
router.delete('/:id', removeTeam);
router.post('/:id/members', postTeamMembers);

export default router;
