import express from 'express';
import * as tmdbController from '../controllers/tmdb.controller.js';

const router = express.Router();

// Trending
router.get('/trending/:mediaType/:timeWindow', tmdbController.getTrending);

// Movies
router.get('/movie/popular', tmdbController.getPopularMovies);
router.get('/movie/top_rated', tmdbController.getTopRatedMovies);
router.get('/movie/now_playing', tmdbController.getNowPlayingMovies);
router.get('/movie/upcoming', tmdbController.getUpcomingMovies);
router.get('/movie/:id', tmdbController.getMovieDetails);
router.get('/movie/:id/credits', tmdbController.getMovieCredits);
router.get('/movie/:id/similar', tmdbController.getSimilarMovies);
router.get('/movie/:id/recommendations', tmdbController.getMovieRecommendations);
router.get('/discover/movie', tmdbController.discoverMovies);

// TV Shows
router.get('/tv/popular', tmdbController.getPopularTVShows);
router.get('/tv/top_rated', tmdbController.getTopRatedTVShows);
router.get('/tv/on_the_air', tmdbController.getOnAirTVShows);
router.get('/tv/airing_today', tmdbController.getAiringTodayTVShows);
router.get('/tv/:id', tmdbController.getTVDetails);
router.get('/tv/:id/credits', tmdbController.getTVCredits);
router.get('/tv/:tvId/season/:seasonNumber', tmdbController.getTVSeasonDetails);
router.get('/tv/:id/similar', tmdbController.getSimilarTVShows);
router.get('/tv/:id/recommendations', tmdbController.getTVRecommendations);
router.get('/discover/tv', tmdbController.discoverTVShows);

// Anime
router.get('/anime', tmdbController.getAnime);
router.get('/anime/movies', tmdbController.getAnimeMovies);

// Search
router.get('/search/multi', tmdbController.searchMulti);
router.get('/search/movie', tmdbController.searchMovies);
router.get('/search/tv', tmdbController.searchTVShows);

export default router;
