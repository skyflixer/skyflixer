import { fetchAllHosts } from '../services/videohosting.service.js';

/**
 * Fetch videos from all hosting services
 * POST /api/videohosting/fetch
 * 
 * Request body:
 * {
 *   title: string,
 *   type: 'movie' | 'series',
 *   year?: number,      // For movies
 *   season?: number,    // For series
 *   episode?: number    // For series
 * }
 */
export async function fetchVideos(req, res) {
    try {
        const { title, type, year, season, episode } = req.body;

        // Validate required fields
        if (!title || !type) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['title', 'type'],
            });
        }

        // Validate type-specific fields
        if (type === 'movie' && !year) {
            return res.status(400).json({
                error: 'Year is required for movies',
            });
        }

        if ((type === 'series' || type === 'tv') && (!season || !episode)) {
            return res.status(400).json({
                error: 'Season and episode are required for series',
            });
        }

        // Prepare TMDB data
        const tmdbData = {
            title,
            type,
            year,
            season,
            episode,
        };

        // Fetch from all hosts
        const results = await fetchAllHosts(tmdbData);

        // Return results
        res.json(results);

    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
        });
    }
}

/**
 * Get video hosting configuration status
 * GET /api/videohosting/status
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

    res.json({
        status,
        message: 'Video hosting service status',
    });
}
