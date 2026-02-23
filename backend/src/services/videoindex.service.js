/**
 * videoindex.service.js
 *
 * Pre-built in-memory video index.
 * Fetches ALL videos from ALL 4 hosting APIs once at startup,
 * then serves O(1) lookups — making player load times milliseconds.
 *
 * Refresh cycle: every 60 minutes automatically.
 */

import axios from 'axios';
import { videoHostingConfig } from '../config/videohosting.config.js';

// ─────────────────────────────────────────────────────────────────────────────
// In-memory indexes
// ─────────────────────────────────────────────────────────────────────────────
// movieIndex: Map<"normalizedTitle:year", Array<VideoEntry>>
// seriesIndex: Map<"normalizedTitle:S:E", Array<VideoEntry>>
let movieIndex = new Map();
let seriesIndex = new Map();
let indexStats = { built: false, buildTime: null, counts: {} };

const REFRESH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const PAGE_TIMEOUT_MS = 8000;               // per-page fetch timeout

// ─────────────────────────────────────────────────────────────────────────────
// Title normalization — ultra-robust
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Normalize a string for matching:
 * lowercase → remove punctuation → collapse spaces
 */
export function normalizeTitle(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')   // replace all non-alphanumeric with space
        .replace(/\s+/g, ' ')            // collapse multiple spaces
        .trim();
}

/**
 * Parse a video filename from hosting APIs.
 *
 * Handles formats:
 *   Movies:  "Ask Me What You Want (2024) {Hindi-Spanish} SKYFLIXER.mkv"
 *   Series:  "Stranger Things S01E01 {Hindi} SKYFLIXER.mkv"
 *            "Stranger Things S01E01.mkv"
 *
 * Returns: { title, normalizedTitle, year, season, episode, originalName }
 */
export function parseVideoFilename(rawName) {
    if (!rawName) return null;

    let name = rawName;

    // 1. Remove file extension (.mkv, .mp4, .avi, .mov, etc.)
    name = name.replace(/\.(mkv|mp4|avi|mov|wmv|flv|webm|m4v|ts|mpg|mpeg)$/i, '');

    // 2. Remove content in curly braces: {Hindi-English}, {Hindi}, etc.
    name = name.replace(/\{[^}]*\}/g, '');

    // 3. Remove SKYFLIX / SKYFLIXER (case-insensitive)
    name = name.replace(/\bSKYFLIX(ER)?\b/gi, '');

    // 4. Clean extra dashes, underscores, dots used as separators
    name = name.replace(/[_]/g, ' ');
    name = name.replace(/\s+-\s*$/, '');       // trailing " -"
    name = name.trim();

    // 5. Extract season+episode: S01E08, s1e8, S01E08-E10 (take first ep)
    const seasonEpMatch = name.match(/S(\d{1,2})E(\d{1,3})/i);
    const season = seasonEpMatch ? parseInt(seasonEpMatch[1], 10) : null;
    const episode = seasonEpMatch ? parseInt(seasonEpMatch[2], 10) : null;

    let titlePart = name;

    if (seasonEpMatch) {
        // Series: title is everything BEFORE S01E01
        titlePart = name.substring(0, seasonEpMatch.index).trim();
    }

    // 6. Extract year: (2024)
    const yearMatch = titlePart.match(/\((\d{4})\)/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : null;

    if (yearMatch) {
        // Movie: title is everything BEFORE (year)
        titlePart = titlePart.substring(0, yearMatch.index).trim();
    }

    // 7. Final cleanup of title
    titlePart = titlePart
        .replace(/\s*-\s*$/, '')        // trailing dash
        .replace(/\s+/g, ' ')
        .trim();

    const normalizedTitle = normalizeTitle(titlePart);

    return {
        title: titlePart,
        normalizedTitle,
        year,
        season,
        episode,
        originalName: rawName,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fuzzy title similarity (word overlap)
// ─────────────────────────────────────────────────────────────────────────────
function wordOverlapScore(a, b) {
    const setA = new Set(a.split(' ').filter(w => w.length > 1));
    const setB = new Set(b.split(' ').filter(w => w.length > 1));
    if (setA.size === 0 || setB.size === 0) return 0;
    let overlap = 0;
    for (const w of setA) if (setB.has(w)) overlap++;
    return overlap / Math.max(setA.size, setB.size);
}

// ─────────────────────────────────────────────────────────────────────────────
// Fetch all pages from one endpoint
// ─────────────────────────────────────────────────────────────────────────────
async function fetchAllPagesForIndex(endpoint, headers) {
    let allVideos = [];

    try {
        const resp1 = await axios.get(endpoint, {
            params: { page: 1 },
            headers,
            timeout: PAGE_TIMEOUT_MS,
        });
        const d1 = resp1.data;

        // Flat array response
        if (Array.isArray(d1)) return d1;

        const page1Videos = d1.data || d1.results || [];
        allVideos = [...page1Videos];

        const meta = d1.metadata || d1.meta || d1;
        const totalPages = meta.maxPage || meta.max_page || meta.total_pages || meta.last_page || meta.totalPages || 1;

        if (totalPages > 1) {
            const remaining = [];
            for (let p = 2; p <= totalPages; p++) remaining.push(p);

            const responses = await Promise.all(
                remaining.map(p =>
                    axios.get(endpoint, {
                        params: { page: p },
                        headers,
                        timeout: PAGE_TIMEOUT_MS,
                    }).catch(() => null)
                )
            );

            for (const r of responses) {
                if (!r) continue;
                const d = r.data;
                if (d.data && Array.isArray(d.data)) allVideos = allVideos.concat(d.data);
                else if (d.results && Array.isArray(d.results)) allVideos = allVideos.concat(d.results);
                else if (Array.isArray(d)) allVideos = allVideos.concat(d);
            }
        }
    } catch (err) {
        console.warn(`[index] fetchAllPages failed for ${endpoint}: ${err.message}`);
    }

    return allVideos;
}

// ─────────────────────────────────────────────────────────────────────────────
// Build index for one host
// ─────────────────────────────────────────────────────────────────────────────
async function buildHostIndex(hostName, newMovieIndex, newSeriesIndex) {
    const cfg = videoHostingConfig[hostName];
    if (!cfg || !cfg.enabled) return { hostName, count: 0 };

    const { embedBase, downloadBase } = getHostBaseUrls(hostName);

    // Try primary first, then fallback
    let videos = await fetchAllPagesForIndex(cfg.primary.endpoint, cfg.primary.headers);
    if (videos.length === 0) {
        console.log(`[index] ${hostName} primary empty, trying fallback...`);
        videos = await fetchAllPagesForIndex(cfg.fallback.endpoint, cfg.fallback.headers);
    }

    console.log(`[index] ${hostName}: ${videos.length} videos fetched`);
    let indexed = 0;

    for (const video of videos) {
        const parsed = parseVideoFilename(video.name || video.title || '');
        if (!parsed || !parsed.title) continue;

        const entry = {
            host: hostName,
            id: video.id,
            name: video.name || video.title,
            embedUrl: `${embedBase}${video.id}`,
            downloadUrl: `${downloadBase}${video.id}&dl=1`,
        };

        if (parsed.season !== null && parsed.episode !== null) {
            // SERIES entry
            const key = `${parsed.normalizedTitle}:${parsed.season}:${parsed.episode}`;
            if (!newSeriesIndex.has(key)) newSeriesIndex.set(key, []);
            newSeriesIndex.get(key).push(entry);
            indexed++;
        } else if (parsed.year !== null) {
            // MOVIE entry
            const key = `${parsed.normalizedTitle}:${parsed.year}`;
            if (!newMovieIndex.has(key)) newMovieIndex.set(key, []);
            newMovieIndex.get(key).push(entry);
            indexed++;
        } else {
            // No year and no S/E — still index by title only (year-agnostic)
            const key = `${parsed.normalizedTitle}:any`;
            if (!newMovieIndex.has(key)) newMovieIndex.set(key, []);
            newMovieIndex.get(key).push(entry);
        }
    }

    return { hostName, count: indexed, total: videos.length };
}

function getHostBaseUrls(hostName) {
    const map = {
        streamp2p: { embedBase: 'https://skyflixerpro.p2pplay.pro/#', downloadBase: 'https://skyflixerpro.p2pplay.pro/#' },
        seekstreaming: { embedBase: 'https://skyflixer.seekplayer.me/#', downloadBase: 'https://skyflixer.seekplayer.me/#' },
        upnshare: { embedBase: 'https://skyflixer.upn.one/#', downloadBase: 'https://skyflixer.upn.one/#' },
        rpmshare: { embedBase: 'https://skyflixer.rpmplay.me/#', downloadBase: 'https://skyflixer.rpmplay.me/#' },
    };
    return map[hostName] || map.streamp2p;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: Rebuild the full index
// ─────────────────────────────────────────────────────────────────────────────
export async function rebuildIndex() {
    console.log('\n[videoindex] Starting full index rebuild...');
    const start = Date.now();

    const newMovieIndex = new Map();
    const newSeriesIndex = new Map();

    const hosts = ['streamp2p', 'seekstreaming', 'upnshare', 'rpmshare'];
    const results = await Promise.all(
        hosts.map(h => buildHostIndex(h, newMovieIndex, newSeriesIndex).catch(err => {
            console.error(`[index] ${h} failed: ${err.message}`);
            return { hostName: h, count: 0, total: 0, error: err.message };
        }))
    );

    // Atomically swap
    movieIndex = newMovieIndex;
    seriesIndex = newSeriesIndex;

    const counts = {};
    results.forEach(r => { counts[r.hostName] = { indexed: r.count, total: r.total }; });

    indexStats = {
        built: true,
        buildTime: new Date().toISOString(),
        durationMs: Date.now() - start,
        movieCount: movieIndex.size,
        seriesCount: seriesIndex.size,
        counts,
    };

    console.log(`[videoindex] ✅ Index built in ${indexStats.durationMs}ms — Movies: ${movieIndex.size} keys, Series: ${seriesIndex.size} keys`);
    return indexStats;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: Lookup movie by title + year
// Returns array of VideoEntry objects (one per host that has it)
// ─────────────────────────────────────────────────────────────────────────────
export function lookupMovie(title, year) {
    const normTitle = normalizeTitle(title);

    // 1. Exact match: title + year
    const exactKey = `${normTitle}:${year}`;
    if (movieIndex.has(exactKey)) return movieIndex.get(exactKey);

    // 2. Year ± 1 tolerance (release year mismatch between TMDB and filename)
    for (const dy of [-1, 1]) {
        const y2Key = `${normTitle}:${year + dy}`;
        if (movieIndex.has(y2Key)) return movieIndex.get(y2Key);
    }

    // 3. Year-agnostic bucket
    const anyKey = `${normTitle}:any`;
    if (movieIndex.has(anyKey)) return movieIndex.get(anyKey);

    // 4. Fuzzy: scan all movie keys for high word-overlap
    let best = null;
    let bestScore = 0;
    for (const [key, entries] of movieIndex.entries()) {
        const [keyTitle, keyYear] = key.split(':');
        if (keyYear !== String(year) && keyYear !== String(year - 1) && keyYear !== String(year + 1) && keyYear !== 'any') continue;
        const score = wordOverlapScore(normTitle, keyTitle);
        if (score > bestScore && score >= 0.7) {
            bestScore = score;
            best = entries;
        }
    }
    return best || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: Lookup TV episode by title + season + episode
// ─────────────────────────────────────────────────────────────────────────────
export function lookupEpisode(title, season, episode) {
    const normTitle = normalizeTitle(title);

    // 1. Exact match
    const exactKey = `${normTitle}:${season}:${episode}`;
    if (seriesIndex.has(exactKey)) return seriesIndex.get(exactKey);

    // 2. Fuzzy title match (same S+E)
    let best = null;
    let bestScore = 0;
    for (const [key, entries] of seriesIndex.entries()) {
        const parts = key.split(':');
        const [keyTitle, keySeason, keyEpisode] = [parts[0], Number(parts[1]), Number(parts[2])];
        if (keySeason !== season || keyEpisode !== episode) continue;
        const score = wordOverlapScore(normTitle, keyTitle);
        if (score > bestScore && score >= 0.6) {
            bestScore = score;
            best = entries;
        }
    }
    return best || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Public: Status / stats
// ─────────────────────────────────────────────────────────────────────────────
export function getIndexStats() {
    return indexStats;
}

export function isIndexReady() {
    return indexStats.built;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto-refresh every 60 minutes
// ─────────────────────────────────────────────────────────────────────────────
export function startAutoRefresh() {
    setInterval(() => {
        console.log('[videoindex] Auto-refresh triggered');
        rebuildIndex().catch(err => console.error('[videoindex] Auto-refresh failed:', err.message));
    }, REFRESH_INTERVAL_MS);
}
