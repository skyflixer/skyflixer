import { Octokit } from '@octokit/rest';
import { cacheGet, cacheSet, cacheDel, TTL } from './cache.service.js';


class GitHubService {
    constructor() {
        this.octokit = new Octokit({
            auth: process.env.GITHUB_TOKEN
        });
        this.owner = process.env.GITHUB_USERNAME;
        this.repo = process.env.GITHUB_REPO;
    }

    /**
     * Save post data to GitHub repository
     * @param {Object} postData - Post data to save
     * @param {string} type - 'movies' or 'tv-shows'
     * @returns {Promise<Object>} GitHub response
     */
    async savePost(postData, type) {
        try {
            const path = `manual-posts/${type}/${postData.id}.json`;
            const content = JSON.stringify(postData, null, 2);
            const contentEncoded = Buffer.from(content).toString('base64');

            // Check if file exists
            let sha = null;
            try {
                const { data } = await this.octokit.repos.getContent({
                    owner: this.owner,
                    repo: this.repo,
                    path
                });
                sha = data.sha; // File exists, get SHA for update
            } catch (error) {
                // File doesn't exist, will create new
            }

            // Create or update file
            const response = await this.octokit.repos.createOrUpdateFileContents({
                owner: this.owner,
                repo: this.repo,
                path,
                message: `${sha ? 'Updated' : 'Added'}: ${postData.title}`,
                content: contentEncoded,
                sha: sha || undefined
            });

            return {
                success: true,
                ...response.data
            };
        } catch (error) {
            console.error('GitHub save error:', error);
            throw new Error(`Failed to save to GitHub: ${error.message}`);
        }
    }

    /**
     * Get post data from GitHub
     * @param {string} slug - Post slug/ID
     * @param {string} type - 'movies' or 'tv-shows'
     * @returns {Promise<Object>} Post data
     */
    async getPost(slug, type) {
        const cacheKey = `gh:post:${type}:${slug}`;
        const cached = cacheGet(cacheKey);
        if (cached !== null) return cached;

        try {
            const path = `manual-posts/${type}/${slug}.json`;
            const { data } = await this.octokit.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path
            });
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            const post = JSON.parse(content);
            cacheSet(cacheKey, post, TTL.MANUAL_POST);
            return post;
        } catch (error) {
            if (error.status === 404) {
                cacheSet(cacheKey, null, TTL.MANUAL_POST); // cache misses too
                return null;
            }
            throw new Error(`Failed to fetch from GitHub: ${error.message}`);
        }
    }

    /**
     * Delete post from GitHub
     * @param {string} id - Post ID
     * @param {string} type - 'movies' or 'tv-shows'
     * @returns {Promise<Object>} GitHub response
     */
    async deletePost(id, type) {
        try {
            const path = `manual-posts/${type}/${id}.json`;

            // Get file SHA (required for deletion)
            const { data } = await this.octokit.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path
            });

            // Delete the file
            const response = await this.octokit.repos.deleteFile({
                owner: this.owner,
                repo: this.repo,
                path,
                message: `Deleted post: ${id}`,
                sha: data.sha
            });

            return {
                success: true,
                ...response.data
            };
        } catch (error) {
            if (error.status === 404) {
                throw new Error('Post not found');
            }
            throw new Error(`Failed to delete from GitHub: ${error.message}`);
        }
    }

    /**
     * Save player settings to GitHub
     * @param {Object} settings - Player settings
     * @returns {Promise<Object>} GitHub response
     */
    async savePlayerSettings(settings) {
        try {
            const path = 'config/player-settings.json';
            const content = JSON.stringify(settings, null, 2);
            const contentEncoded = Buffer.from(content).toString('base64');

            // Check if file exists
            let sha = null;
            try {
                const { data } = await this.octokit.repos.getContent({
                    owner: this.owner,
                    repo: this.repo,
                    path
                });
                sha = data.sha;
            } catch (error) {
                // File doesn't exist
            }

            const response = await this.octokit.repos.createOrUpdateFileContents({
                owner: this.owner,
                repo: this.repo,
                path,
                message: `Updated player settings: ${settings.defaultPlayer}`,
                content: contentEncoded,
                sha: sha || undefined
            });

            return {
                success: true,
                ...response.data
            };
        } catch (error) {
            throw new Error(`Failed to save player settings: ${error.message}`);
        }
    }

    /**
     * Get player settings from GitHub
     * @returns {Promise<Object>} Player settings
     */
    async getPlayerSettings() {
        const cacheKey = 'gh:player-settings';
        const cached = cacheGet(cacheKey);
        if (cached !== null) return cached;

        try {
            const path = 'config/player-settings.json';
            const { data } = await this.octokit.repos.getContent({
                owner: this.owner,
                repo: this.repo,
                path
            });
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            const settings = JSON.parse(content);
            cacheSet(cacheKey, settings, TTL.PLAYER_SETTINGS);
            return settings;
        } catch (error) {
            console.warn('GitHub getPlayerSettings warning:', error.message);
            const defaults = { defaultPlayer: 'streamp2p', lastUpdated: new Date().toISOString() };
            cacheSet(cacheKey, defaults, TTL.PLAYER_SETTINGS);
            return defaults;
        }
    }

    /**
     * Get repository status and stats
     * @returns {Promise<Object>} Repository status
     */
    async getRepoStatus() {
        const cacheKey = 'gh:repo-status';
        const cached = cacheGet(cacheKey);
        if (cached !== null) return cached;

        try {
            const { data: repo } = await this.octokit.repos.get({
                owner: this.owner,
                repo: this.repo
            });

            let manualPostsCount = 0;
            try {
                const { data: movies } = await this.octokit.repos.getContent({
                    owner: this.owner,
                    repo: this.repo,
                    path: 'manual-posts/movies'
                });
                const { data: tvShows } = await this.octokit.repos.getContent({
                    owner: this.owner,
                    repo: this.repo,
                    path: 'manual-posts/tv-shows'
                });
                manualPostsCount = (Array.isArray(movies) ? movies.length : 0) +
                    (Array.isArray(tvShows) ? tvShows.length : 0);
            } catch (error) { /* Directory might not exist yet */ }

            const result = {
                connected: true,
                repository: `${this.owner}/${this.repo}`,
                manualPostsCount,
                lastSync: new Date().toISOString(),
                updatedAt: repo.updated_at
            };
            cacheSet(cacheKey, result, TTL.GITHUB_STATUS);
            return result;
        } catch (error) {
            return { connected: false, error: error.message };
        }
    }

    /**
     * Get recent commits
     * @param {number} count - Number of commits to fetch
     * @returns {Promise<Array>} Recent commits
     */
    async getRecentCommits(count = 5) {
        try {
            const { data } = await this.octokit.repos.listCommits({
                owner: this.owner,
                repo: this.repo,
                per_page: count
            });

            return data.map(commit => ({
                message: commit.commit.message,
                author: commit.commit.author.name,
                date: commit.commit.author.date,
                sha: commit.sha.substring(0, 7)
            }));
        } catch (error) {
            return [];
        }
    }
}

export default new GitHubService();
