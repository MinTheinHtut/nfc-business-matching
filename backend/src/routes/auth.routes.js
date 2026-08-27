import { Router } from 'express';
import { getCurrentUser, login, logout } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/login', login);
// Logout is idempotent: even an expired session should clear the browser cookie.
router.post('/logout', logout);
router.get('/me', requireAuth, getCurrentUser);

export default router;
