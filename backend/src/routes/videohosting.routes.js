import express from 'express';
import { fetchVideos, getStatus, getIndexStatus } from '../controllers/videohosting.controller.js';

const router = express.Router();

// POST /api/videohosting/fetch — instant index lookup
router.post('/fetch', fetchVideos);

// GET /api/videohosting/status — hosting config status
router.get('/status', getStatus);

// GET /api/videohosting/index-status — number of indexed videos per host
router.get('/index-status', getIndexStatus);

export default router;
