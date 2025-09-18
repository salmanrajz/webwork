import express from 'express';
import {
  getRestrictionRules,
  createRestrictionRule,
  updateRestrictionRule,
  deleteRestrictionRule,
  checkUrlRestriction,
  recordViolation,
  getViolations,
  acknowledgeViolation
} from '../controllers/restrictionController.js';
import { authenticate as auth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Restriction Rules Management
router.get('/rules', getRestrictionRules);
router.post('/rules', createRestrictionRule);
router.put('/rules/:id', updateRestrictionRule);
router.delete('/rules/:id', deleteRestrictionRule);

// URL Restriction Checking
router.post('/check', checkUrlRestriction);

// Violation Management
router.post('/violations', recordViolation);
router.get('/violations', getViolations);
router.put('/violations/:id/acknowledge', acknowledgeViolation);

export default router;
