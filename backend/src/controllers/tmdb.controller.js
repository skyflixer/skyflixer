import * as tmdbService from '../services/tmdb.service.js';

/**
 * Error handler wrapper for async controllers
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Trending
export const getTrending = asyncHandler(async (req, res) => {
    const { mediaType = 'all', timeWindow = 'week' } = req.params;
    const data = await tmdbService.getTrending(mediaType, timeWindow);
    res.json(data);
});

// Popular Movies
export const getPopularMovies = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getPopularMovies(page);
    res.json(data);
});

// Top Rated Movies
export const getTopRatedMovies = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getTopRatedMovies(page);
    res.json(data);
});

// Now Playing Movies
export const getNowPlayingMovies = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getNowPlayingMovies(page);
    res.json(data);
});

// Upcoming Movies
export const getUpcomingMovies = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getUpcomingMovies(page);
    res.json(data);
});

// Movie Details
export const getMovieDetails = asyncHandler(async (req, res) => {
    const movieId = parseInt(req.params.id);
    const data = await tmdbService.getMovieDetails(movieId);
    res.json(data);
});

// Movie Credits
export const getMovieCredits = asyncHandler(async (req, res) => {
    const movieId = parseInt(req.params.id);
    const data = await tmdbService.getMovieCredits(movieId);
    res.json(data);
});

// Similar Movies
export const getSimilarMovies = asyncHandler(async (req, res) => {
    const movieId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getSimilarMovies(movieId, page);
    res.json(data);
});

// Movie Recommendations
export const getMovieRecommendations = asyncHandler(async (req, res) => {
    const movieId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getMovieRecommendations(movieId, page);
    res.json(data);
});

// Discover Movies
export const discoverMovies = asyncHandler(async (req, res) => {
    const data = await tmdbService.discoverMovies(req.query);
    res.json(data);
});

// Popular TV Shows
export const getPopularTVShows = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getPopularTVShows(page);
    res.json(data);
});

// Top Rated TV Shows
export const getTopRatedTVShows = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getTopRatedTVShows(page);
    res.json(data);
});

// On Air TV Shows
export const getOnAirTVShows = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getOnAirTVShows(page);
    res.json(data);
});

// Airing Today TV Shows
export const getAiringTodayTVShows = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getAiringTodayTVShows(page);
    res.json(data);
});

// TV Details
export const getTVDetails = asyncHandler(async (req, res) => {
    const tvId = parseInt(req.params.id);
    const data = await tmdbService.getTVDetails(tvId);
    res.json(data);
});

// TV Credits
export const getTVCredits = asyncHandler(async (req, res) => {
    const tvId = parseInt(req.params.id);
    const data = await tmdbService.getTVCredits(tvId);
    res.json(data);
});

// TV Season Details
export const getTVSeasonDetails = asyncHandler(async (req, res) => {
    const tvId = parseInt(req.params.tvId);
    const seasonNumber = parseInt(req.params.seasonNumber);
    const data = await tmdbService.getTVSeasonDetails(tvId, seasonNumber);
    res.json(data);
});

// Similar TV Shows
export const getSimilarTVShows = asyncHandler(async (req, res) => {
    const tvId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getSimilarTVShows(tvId, page);
    res.json(data);
});

// TV Recommendations
export const getTVRecommendations = asyncHandler(async (req, res) => {
    const tvId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getTVRecommendations(tvId, page);
    res.json(data);
});

// Discover TV Shows
export const discoverTVShows = asyncHandler(async (req, res) => {
    const data = await tmdbService.discoverTVShows(req.query);
    res.json(data);
});

// Anime
export const getAnime = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getAnime(page);
    res.json(data);
});

// Anime Movies
export const getAnimeMovies = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const data = await tmdbService.getAnimeMovies(page);
    res.json(data);
});

// Search Multi
export const searchMulti = asyncHandler(async (req, res) => {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    const data = await tmdbService.searchMulti(query, page);
    res.json(data);
});

// Search Movies
export const searchMovies = asyncHandler(async (req, res) => {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    const data = await tmdbService.searchMovies(query, page);
    res.json(data);
});

// Search TV Shows
export const searchTVShows = asyncHandler(async (req, res) => {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    const data = await tmdbService.searchTVShows(query, page);
    res.json(data);
});
