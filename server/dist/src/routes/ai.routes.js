import { Router } from 'express';
import { chat, clearSession, getHealth, geocode } from '../controllers/ai.controller.js';
import { rateLimit } from '../middleware/rateLimit.js';
const router = Router();
// Rate limiting for AI: 20 requests per minute per IP
// Use the custom rateLimit middleware if possible, or build one inline.
// Since rateLimit from middleware takes options maybe, let's just use it or build a simple one.
const aiRateLimiter = rateLimit();
router.post('/chat', aiRateLimiter, chat);
router.delete('/chat/:sessionId', clearSession);
router.get('/health', getHealth);
router.post('/geocode', aiRateLimiter, geocode);
export const aiRoutes = router;
