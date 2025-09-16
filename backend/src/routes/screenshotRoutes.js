import { Router } from 'express';
import multer from 'multer';
import {
  getScreenshot,
  getScreenshots,
  postScreenshot,
  removeScreenshot
} from '../controllers/screenshotController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

router.get('/', getScreenshots);
router.post('/', upload.single('screenshot'), postScreenshot);
router.get('/:id', getScreenshot);
router.delete('/:id', removeScreenshot);

export default router;
