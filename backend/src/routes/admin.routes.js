import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyAdminToken } from '../middleware/auth.middleware.js';
import githubService from '../services/github.service.js';

const router = express.Router();

/**
 * Admin Login
 * POST /api/admin/login
 */
router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }

        // Compare password
        if (password !== process.env.ADMIN_PASSWORD) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { role: 'admin', timestamp: Date.now() },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '30m' }
        );

        res.json({
            success: true,
            token,
            expiresIn: '30m'
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

/**
 * Verify Token
 * POST /api/admin/verify
 */
router.post('/verify', verifyAdminToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid'
    });
});

/**
 * Search Movies/TV Shows
 * POST /api/admin/search
 */
router.post('/search', verifyAdminToken, async (req, res) => {
    try {
        const { query, type } = req.body; // type: 'movie' | 'tv' | 'all'

        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Query must be at least 2 characters'
            });
        }

        const apiKey = process.env.TMDB_API_KEY;
        const results = [];

        // Search movies
        if (type === 'movie' || type === 'all') {
            const movieResponse = await fetch(
                `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`
            );
            const movieData = await movieResponse.json();
            if (movieData.results) {
                results.push(...movieData.results.map(item => ({ ...item, media_type: 'movie' })));
            }
        }

        // Search TV shows
        if (type === 'tv' || type === 'all') {
            const tvResponse = await fetch(
                `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}`
            );
            const tvData = await tvResponse.json();
            if (tvData.results) {
                results.push(...tvData.results.map(item => ({ ...item, media_type: 'tv' })));
            }
        }

        res.json({
            success: true,
            results: results.slice(0, 20) // Limit to 20 results
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Search failed'
        });
    }
});

/**
 * Save Post to GitHub
 * POST /api/admin/save-post
 */
router.post('/save-post', verifyAdminToken, async (req, res) => {
    try {
        const { postData, type } = req.body; // type: 'movies' | 'tv-shows'

        if (!postData || !type) {
            return res.status(400).json({
                success: false,
                message: 'Post data and type are required'
            });
        }

        // Add metadata
        const postToSave = {
            ...postData,
            isManualEdit: true,
            lastModified: new Date().toISOString()
        };

        const result = await githubService.savePost(postToSave, type);

        res.json({
            success: true,
            message: 'Post saved successfully',
            data: result
        });
    } catch (error) {
        console.error('Save post error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to save post'
        });
    }
});

/**
 * Delete Post from GitHub
 * POST /api/admin/delete-post
 */
router.post('/delete-post', verifyAdminToken, async (req, res) => {
    try {
        const { id, type } = req.body; // type: 'movies' | 'tv-shows'

        if (!id || !type) {
            return res.status(400).json({
                success: false,
                message: 'Post ID and type are required'
            });
        }

        const result = await githubService.deletePost(id, type);

        res.json({
            success: true,
            message: 'Post deleted successfully',
            data: result
        });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete post'
        });
    }
});

/**
 * Get Post from GitHub
 * GET /api/admin/get-post/:type/:slug
 */
router.get('/get-post/:type/:slug', verifyAdminToken, async (req, res) => {
    try {
        const { type, slug } = req.params;

        const post = await githubService.getPost(slug, type);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        res.json({
            success: true,
            data: post
        });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch post'
        });
    }
});

/**
 * Get Manual Post (Public - No Auth Required)
 * GET /api/admin/manual-post/:type/:id
 */
router.get('/manual-post/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;

        const post = await githubService.getPost(id, type);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Manual post not found'
            });
        }

        res.json({
            success: true,
            data: post
        });
    } catch (error) {
        console.error('Get manual post error:', error);
        res.status(404).json({
            success: false,
            message: 'Manual post not found'
        });
    }
});

/**
 * Save Player Settings
 * POST /api/admin/save-player-settings
 */
router.post('/save-player-settings', verifyAdminToken, async (req, res) => {
    try {
        const { defaultPlayer } = req.body;

        if (!defaultPlayer) {
            return res.status(400).json({
                success: false,
                message: 'Default player is required'
            });
        }

        const settings = {
            defaultPlayer,
            lastUpdated: new Date().toISOString()
        };

        const result = await githubService.savePlayerSettings(settings);

        res.json({
            success: true,
            message: 'Player settings saved successfully',
            data: result
        });
    } catch (error) {
        console.error('Save player settings error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to save player settings'
        });
    }
});

/**
 * Get Player Settings
 * GET /api/admin/player-settings
 */
router.get('/player-settings', async (req, res) => {
    try {
        const settings = await githubService.getPlayerSettings();

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Get player settings error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch player settings'
        });
    }
});

/**
 * Get GitHub Status
 * GET /api/admin/github-status
 */
router.get('/github-status', verifyAdminToken, async (req, res) => {
    try {
        const status = await githubService.getRepoStatus();

        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Get GitHub status error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch GitHub status'
        });
    }
});

/**
 * Get Recent Activity
 * GET /api/admin/recent-activity
 */
router.get('/recent-activity', verifyAdminToken, async (req, res) => {
    try {
        const commits = await githubService.getRecentCommits(5);

        res.json({
            success: true,
            data: commits
        });
    } catch (error) {
        console.error('Get recent activity error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch recent activity'
        });
    }
});

export default router;
