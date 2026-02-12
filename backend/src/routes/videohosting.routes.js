import express from 'express';
import { fetchVideos, getStatus } from '../controllers/videohosting.controller.js';

const router = express.Router();

/**
 * POST /api/videohosting/fetch
 * Fetch videos from all hosting services
 */
router.post('/fetch', fetchVideos);

/**
 * GET /api/videohosting/status
 * Get video hosting service status
 */
router.get('/status', getStatus);

export default router;
