import axios from 'axios';
import { config } from '../config/api.config.js';

// Simple in-memory cache
const cache = new Map();

/**
 * Get cache key from endpoint and params
 */
function getCacheKey(endpoint, params = {}) {
    const sortedParams = Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
    return `tmdb_${endpoint}_${sortedParams}`;
}

/**
 * Get data from cache
 */
function getFromCache(key) {
    const cached = cache.get(key);
    if (!cached) return null;

    const { data, timestamp } = cached;
    if (Date.now() - timestamp > config.cache.duration) {
        cache.delete(key);
        return null;
    }
    return data;
}

/**
 * Set data in cache
 */
function setCache(key, data) {
    cache.set(key, { data, timestamp: Date.now() });

    // Clean old cache entries if cache gets too large
    // Increased from 1000 to 2000 for better performance
    if (cache.size > 2000) {
        const entries = Array.from(cache.entries());
        const halfLength = Math.floor(entries.length / 2);
        entries.slice(0, halfLength).forEach(([key]) => cache.delete(key));
    }
}

/**
 * Fetch data from TMDB API
 */
export async function fetchTMDB(endpoint, params = {}, useCache = true) {
    const cacheKey = getCacheKey(endpoint, params);

    // Check cache
    if (useCache) {
        const cached = getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
    }

    // Build request
    const url = `${config.tmdb.baseUrl}${endpoint}`;
    const requestParams = {
        api_key: config.tmdb.apiKey,
        ...params,
    };

    try {
        const response = await axios.get(url, { params: requestParams });
        const data = response.data;

        // Cache the response
        if (useCache) {
            setCache(cacheKey, data);
        }

        return data;
    } catch (error) {
        // Handle TMDB API errors
        if (error.response) {
            throw new Error(`TMDB API Error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
            throw new Error('TMDB API Error: No response received');
        } else {
            throw new Error(`TMDB API Error: ${error.message}`);
        }
    }
}

/**
 * Get image URL
 */
export function getImageUrl(path, size = 'w500') {
    if (!path) return null;
    return `${config.tmdb.imageBase}/${size}${path}`;
}

// Trending
export async function getTrending(mediaType = 'all', timeWindow = 'week') {
    return fetchTMDB(`/trending/${mediaType}/${timeWindow}`);
}

// Movies
export async function getPopularMovies(page = 1) {
    return fetchTMDB('/movie/popular', { page });
}

export async function getTopRatedMovies(page = 1) {
    return fetchTMDB('/movie/top_rated', { page });
}

export async function getNowPlayingMovies(page = 1) {
    return fetchTMDB('/movie/now_playing', { page });
}

export async function getUpcomingMovies(page = 1) {
    return fetchTMDB('/movie/upcoming', { page });
}

export async function getMovieDetails(movieId) {
    return fetchTMDB(`/movie/${movieId}`);
}

export async function getMovieCredits(movieId) {
    return fetchTMDB(`/movie/${movieId}/credits`);
}

export async function getSimilarMovies(movieId, page = 1) {
    return fetchTMDB(`/movie/${movieId}/similar`, { page });
}

export async function getMovieRecommendations(movieId, page = 1) {
    return fetchTMDB(`/movie/${movieId}/recommendations`, { page });
}

export async function discoverMovies(params = {}) {
    return fetchTMDB('/discover/movie', { page: 1, ...params });
}

// TV Shows
export async function getPopularTVShows(page = 1) {
    return fetchTMDB('/tv/popular', { page });
}

export async function getTopRatedTVShows(page = 1) {
    return fetchTMDB('/tv/top_rated', { page });
}

export async function getOnAirTVShows(page = 1) {
    return fetchTMDB('/tv/on_the_air', { page });
}

export async function getAiringTodayTVShows(page = 1) {
    return fetchTMDB('/tv/airing_today', { page });
}

export async function getTVDetails(tvId) {
    return fetchTMDB(`/tv/${tvId}`);
}

export async function getTVCredits(tvId) {
    return fetchTMDB(`/tv/${tvId}/credits`);
}

export async function getTVSeasonDetails(tvId, seasonNumber) {
    return fetchTMDB(`/tv/${tvId}/season/${seasonNumber}`);
}

export async function getSimilarTVShows(tvId, page = 1) {
    return fetchTMDB(`/tv/${tvId}/similar`, { page });
}

export async function getTVRecommendations(tvId, page = 1) {
    return fetchTMDB(`/tv/${tvId}/recommendations`, { page });
}

export async function discoverTVShows(params = {}) {
    return fetchTMDB('/discover/tv', { page: 1, ...params });
}

// Anime
export async function getAnime(page = 1) {
    return discoverTVShows({
        page,
        with_genres: '16', // Animation
        with_origin_country: 'JP',
        sort_by: 'popularity.desc',
    });
}

export async function getAnimeMovies(page = 1) {
    return discoverMovies({
        page,
        with_genres: '16', // Animation
        with_original_language: 'ja',
        sort_by: 'popularity.desc',
    });
}

// Search
export async function searchMulti(query, page = 1) {
    return fetchTMDB('/search/multi', { query, page }, false); // Don't cache search
}

export async function searchMovies(query, page = 1) {
    return fetchTMDB('/search/movie', { query, page }, false);
}

export async function searchTVShows(query, page = 1) {
    return fetchTMDB('/search/tv', { query, page }, false);
}
