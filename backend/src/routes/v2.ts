import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// All v2 routes require authentication
router.use(authenticate);

// v2 routes (non-scraper)
// Add other v2 routes here as needed

export default router;