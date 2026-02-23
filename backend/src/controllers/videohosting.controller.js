import { fetchAllHosts } from '../services/videohosting.service.js';
import { getIndexStats } from '../services/videoindex.service.js';

/**
 * POST /api/videohosting/fetch
 * Fetch videos from all hosting services (uses index for instant lookup)
 */
export async function fetchVideos(req, res) {
    try {
        const { title, type, year, season, episode } = req.body;

        if (!title || !type) {
            return res.status(400).json({ error: 'Missing required fields', required: ['title', 'type'] });
        }
        if (type === 'movie' && !year) {
            return res.status(400).json({ error: 'Year is required for movies' });
        }
        if ((type === 'series' || type === 'tv') && (!season || !episode)) {
            return res.status(400).json({ error: 'Season and episode are required for series' });
        }

        const tmdbData = { title, type, year, season, episode };
        const results = await fetchAllHosts(tmdbData);
        res.json(results);

    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}

/**
 * GET /api/videohosting/status
 * Get video hosting configuration status
 */
export async function getStatus(req, res) {
    const { videoHostingConfig } = await import('../config/videohosting.config.js');
    const status = {};
    Object.keys(videoHostingConfig).forEach(host => {
        status[host] = {
            enabled: videoHostingConfig[host].enabled,
            hasCredentials: !!(videoHostingConfig[host].primary.apiKey),
        };
    });
    res.json({ status, message: 'Video hosting service status' });
}

/**
 * GET /api/videohosting/index-status
 * Returns stats about the in-memory video index
 */
export async function getIndexStatus(req, res) {
    const stats = getIndexStats();
    res.json({ success: true, data: stats });
}
