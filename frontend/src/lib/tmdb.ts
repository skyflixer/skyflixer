// TMDB API Configuration and Utilities
// Updated to use backend API instead of direct TMDB calls

import apiClient from "@/services/api.service";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// Cache configuration
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Image sizes
export const IMAGE_SIZES = {
  poster: {
    small: "w185",
    medium: "w342",
    large: "w500",
    original: "original",
  },
  backdrop: {
    small: "w300",
    medium: "w780",
    large: "w1280",
    original: "original",
  },
  profile: {
    small: "w45",
    medium: "w185",
    large: "h632",
    original: "original",
  },
  still: {
    small: "w92",
    medium: "w185",
    large: "w300",
    original: "original",
  },
} as const;

// Types
export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  popularity: number;
  original_language: string;
  video: boolean;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  original_language: string;
  origin_country: string[];
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number;
  genres: { id: number; name: string }[];
  production_companies: { id: number; name: string; logo_path: string | null }[];
  tagline: string;
  status: string;
  budget: number;
  revenue: number;
  spoken_languages: { english_name: string; iso_639_1: string; name: string }[];
}

export interface TMDBTVDetails extends TMDBTVShow {
  episode_run_time: number[];
  genres: { id: number; name: string }[];
  created_by: { id: number; name: string; profile_path: string | null }[];
  number_of_episodes: number;
  number_of_seasons: number;
  seasons: TMDBSeason[];
  status: string;
  networks: { id: number; name: string; logo_path: string | null }[];
}

export interface TMDBSeason {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  season_number: number;
  air_date: string;
  vote_average: number;
  runtime: number;
}

export interface TMDBCredits {
  cast: {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
  }[];
  crew: {
    id: number;
    name: string;
    job: string;
    department: string;
    profile_path: string | null;
  }[];
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface Genre {
  id: number;
  name: string;
}

// Movie Genres
export const MOVIE_GENRES: Genre[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

// TV Genres
export const TV_GENRES: Genre[] = [
  { id: 10759, name: "Action & Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 10762, name: "Kids" },
  { id: 9648, name: "Mystery" },
  { id: 10763, name: "News" },
  { id: 10764, name: "Reality" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10766, name: "Soap" },
  { id: 10767, name: "Talk" },
  { id: 10768, name: "War & Politics" },
  { id: 37, name: "Western" },
];

// Cache utilities
function getCacheKey(endpoint: string, params: Record<string, string | number> = {}): string {
  const sortedParams = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return `tmdb_cache_${endpoint}_${sortedParams}`;
}

function getFromCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    return data as T;
  } catch {
    return null;
  }
}

function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (error) {
    // If localStorage is full, clear old cache entries
    console.warn("Cache storage failed, clearing old entries");
    clearOldCache();
  }
}

function clearOldCache(): void {
  const keys = Object.keys(localStorage).filter(key => key.startsWith("tmdb_cache_"));
  const halfLength = Math.floor(keys.length / 2);
  keys.slice(0, halfLength).forEach(key => localStorage.removeItem(key));
}

// API fetch utility - now calls backend instead of TMDB directly
async function fetchTMDB<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
  useCache = true
): Promise<T> {
  const cacheKey = getCacheKey(endpoint, params);

  if (useCache) {
    const cached = getFromCache<T>(cacheKey);
    if (cached) return cached;
  }

  // Call backend API instead of TMDB directly
  try {
    const response = await apiClient.get(`/api/tmdb${endpoint}`, { params });
    const data = response.data;

    if (useCache) {
      setCache(cacheKey, data);
    }

    return data as T;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

// Image URL builder
export function getImageUrl(
  path: string | null,
  size: string = "w500"
): string {
  if (!path) return "/placeholder.svg";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

// API Methods

// Trending
export async function getTrending(
  mediaType: "movie" | "tv" | "all" = "all",
  timeWindow: "day" | "week" = "week"
): Promise<TMDBResponse<TMDBMovie | TMDBTVShow>> {
  return fetchTMDB(`/trending/${mediaType}/${timeWindow}`);
}

// Movies
export async function getPopularMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB("/movie/popular", { page });
}

export async function getTopRatedMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB("/movie/top_rated", { page });
}

export async function getNowPlayingMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB("/movie/now_playing", { page });
}

export async function getUpcomingMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB("/movie/upcoming", { page });
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetails> {
  return fetchTMDB(`/movie/${movieId}`);
}

export async function getMovieCredits(movieId: number): Promise<TMDBCredits> {
  return fetchTMDB(`/movie/${movieId}/credits`);
}

export async function getSimilarMovies(movieId: number, page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB(`/movie/${movieId}/similar`, { page });
}

export async function getMovieRecommendations(movieId: number, page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB(`/movie/${movieId}/recommendations`, { page });
}

export async function discoverMovies(
  params: {
    page?: number;
    with_genres?: string;
    sort_by?: string;
    "vote_average.gte"?: number;
    "release_date.gte"?: string;
    "release_date.lte"?: string;
    with_original_language?: string;
  } = {}
): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB("/discover/movie", { page: 1, ...params });
}

// TV Shows
export async function getPopularTVShows(page = 1): Promise<TMDBResponse<TMDBTVShow>> {
  return fetchTMDB("/tv/popular", { page });
}

export async function getTopRatedTVShows(page = 1): Promise<TMDBResponse<TMDBTVShow>> {
  return fetchTMDB("/tv/top_rated", { page });
}

export async function getOnAirTVShows(page = 1): Promise<TMDBResponse<TMDBTVShow>> {
  return fetchTMDB("/tv/on_the_air", { page });
}

export async function getAiringTodayTVShows(page = 1): Promise<TMDBResponse<TMDBTVShow>> {
  return fetchTMDB("/tv/airing_today", { page });
}

export async function getTVDetails(tvId: number): Promise<TMDBTVDetails> {
  return fetchTMDB(`/tv/${tvId}`);
}

export async function getTVCredits(tvId: number): Promise<TMDBCredits> {
  return fetchTMDB(`/tv/${tvId}/credits`);
}

export async function getTVSeasonDetails(
  tvId: number,
  seasonNumber: number
): Promise<{ episodes: TMDBEpisode[] }> {
  return fetchTMDB(`/tv/${tvId}/season/${seasonNumber}`);
}

export async function getSimilarTVShows(tvId: number, page = 1): Promise<TMDBResponse<TMDBTVShow>> {
  return fetchTMDB(`/tv/${tvId}/similar`, { page });
}

export async function getTVRecommendations(tvId: number, page = 1): Promise<TMDBResponse<TMDBTVShow>> {
  return fetchTMDB(`/tv/${tvId}/recommendations`, { page });
}

export async function discoverTVShows(
  params: {
    page?: number;
    with_genres?: string;
    sort_by?: string;
    "vote_average.gte"?: number;
    "first_air_date.gte"?: string;
    "first_air_date.lte"?: string;
    with_original_language?: string;
    with_origin_country?: string;
  } = {}
): Promise<TMDBResponse<TMDBTVShow>> {
  return fetchTMDB("/discover/tv", { page: 1, ...params });
}

// Anime (Animation genre from Japan)
export async function getAnime(page = 1): Promise<TMDBResponse<TMDBTVShow>> {
  return discoverTVShows({
    page,
    with_genres: "16", // Animation
    with_origin_country: "JP",
    sort_by: "popularity.desc",
  });
}

export async function getAnimeMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
  return discoverMovies({
    page,
    with_genres: "16", // Animation
    with_original_language: "ja",
    sort_by: "popularity.desc",
  });
}

// Search
export async function searchMulti(
  query: string,
  page = 1
): Promise<TMDBResponse<TMDBMovie | TMDBTVShow>> {
  return fetchTMDB("/search/multi", { query, page }, false); // Don't cache search results
}

export async function searchMovies(
  query: string,
  page = 1
): Promise<TMDBResponse<TMDBMovie>> {
  return fetchTMDB("/search/movie", { query, page }, false);
}

export async function searchTVShows(
  query: string,
  page = 1
): Promise<TMDBResponse<TMDBTVShow>> {
  return fetchTMDB("/search/tv", { query, page }, false);
}

// Helper functions
export function isMovie(item: TMDBMovie | TMDBTVShow): item is TMDBMovie {
  return "title" in item;
}

export function isTVShow(item: TMDBMovie | TMDBTVShow): item is TMDBTVShow {
  return "name" in item;
}

export function getTitle(item: TMDBMovie | TMDBTVShow): string {
  return isMovie(item) ? item.title : item.name;
}

export function getReleaseYear(item: TMDBMovie | TMDBTVShow): string {
  const date = isMovie(item) ? item.release_date : item.first_air_date;
  return date ? new Date(date).getFullYear().toString() : "";
}

export function formatRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function getAgeRating(adult: boolean): string {
  return adult ? "18+" : "13+";
}
export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove multiple hyphens
    .trim();
}

export async function searchMovie(query: string): Promise<TMDBMovie | null> {
  const results = await searchMovies(query);
  return results.results[0] || null;
}

export async function searchTV(query: string): Promise<TMDBTVShow | null> {
  const results = await searchTVShows(query);
  return results.results[0] || null;
}
