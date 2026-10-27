import { Router } from 'express';
import { generateCards } from '../controllers/generateController.js';
import { authenticate } from '../middleware/auth.js';
import { generationRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/', authenticate, generationRateLimiter, generateCards);

export default router;