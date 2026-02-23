/**
 * videohosting.service.js
 *
 * Looks up videos using the pre-built in-memory index (videoindex.service.js)
 * for instant (<10ms) responses. Falls back to live API scan only if the index
 * has not been built yet (i.e., very first request on cold start).
 */

import axios from 'axios';
import { videoHostingConfig, timeoutConfig } from '../config/videohosting.config.js';
import { cacheGet, cacheSet, TTL } from './cache.service.js';
import {
    lookupMovie,
    lookupEpisode,
    isIndexReady,
    parseVideoFilename,
    normalizeTitle,
} from './videoindex.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// Host base URL helper
// ─────────────────────────────────────────────────────────────────────────────
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
// Extract embed URL from iframe code  (kept for live-scan fallback)
// ─────────────────────────────────────────────────────────────────────────────
export function extractEmbedUrl(embedCode) {
    if (!embedCode) return null;
    if (embedCode.startsWith('http')) return embedCode;
    const match = embedCode.match(/src=['"]([^'"]+)['"]/i);
    return match ? match[1] : embedCode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-export helpers that other parts of the app may import
// ─────────────────────────────────────────────────────────────────────────────
export { parseVideoFilename as parseVideoTitle };

// ─────────────────────────────────────────────────────────────────────────────
// Build the structured server result from index entries
// ─────────────────────────────────────────────────────────────────────────────
function entriesToServerMap(entries) {
    // entries = [{host, id, embedUrl, downloadUrl}, ...]
    // Returns { streamp2p: {...}, seekstreaming: {...}, ... }
    const map = {};
    for (const e of entries) {
        // Keep highest-priority entry per host (first seen wins)
        if (!map[e.host]) {
            map[e.host] = {
                hostName: e.host,
                available: true,
                embedUrl: e.embedUrl,
                downloadUrl: e.downloadUrl,
                source: 'index',
            };
        }
    }
    return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Index-based fast path lookup
// ─────────────────────────────────────────────────────────────────────────────
function indexLookup(tmdbData) {
    const { title, type, year, season, episode } = tmdbData;

    let entries = [];
    if (type === 'movie') {
        entries = lookupMovie(title, year);
    } else {
        entries = lookupEpisode(title, season, episode);
    }

    if (!entries || entries.length === 0) return null;

    const servers = entriesToServerMap(entries);
    return {
        servers,
        availableCount: Object.keys(servers).length,
        tmdbData,
        source: 'index',
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Live-scan fallback (used only when index is not ready yet)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchAllPagesLive(endpoint, headers, timeout) {
    const resp1 = await axios.get(endpoint, { params: { page: 1 }, headers, timeout });
    const d1 = resp1.data;
    if (Array.isArray(d1)) return d1;

    let videos = d1.data || d1.results || [];
    const meta = d1.metadata || d1.meta || d1;
    const totalPages = meta.maxPage || meta.max_page || meta.total_pages || meta.last_page || 1;

    if (totalPages > 1) {
        const pages = [];
        for (let p = 2; p <= totalPages; p++) pages.push(p);
        const responses = await Promise.all(
            pages.map(p => axios.get(endpoint, { params: { page: p }, headers, timeout }).catch(() => null))
        );
        for (const r of responses) {
            if (!r) continue;
            const d = r.data;
            if (d.data && Array.isArray(d.data)) videos = videos.concat(d.data);
            else if (d.results && Array.isArray(d.results)) videos = videos.concat(d.results);
            else if (Array.isArray(d)) videos = videos.concat(d);
        }
    }
    return videos;
}

function liveScanMatchContent(tmdbData, parsed) {
    if (!parsed || !tmdbData) return false;
    const normA = normalizeTitle(tmdbData.title);
    const normB = normalizeTitle(parsed.title);
    if (!normA || !normB) return false;

    // Exact or contains match
    const exact = normA === normB || normB.includes(normA) || normA.includes(normB);
    // Word-overlap fallback (≥70%)
    const words = (s) => new Set(s.split(' ').filter(w => w.length > 1));
    const setA = words(normA), setB = words(normB);
    let overlap = 0;
    for (const w of setA) if (setB.has(w)) overlap++;
    const fuzzy = (setA.size && setB.size) ? overlap / Math.max(setA.size, setB.size) >= 0.7 : false;
    const titleOk = exact || fuzzy;
    if (!titleOk) return false;

    if (tmdbData.type === 'movie') return !parsed.year || parsed.year === tmdbData.year || Math.abs(parsed.year - tmdbData.year) <= 1;
    return parsed.season === tmdbData.season && parsed.episode === tmdbData.episode;
}

async function liveScanHost(hostName, tmdbData) {
    const cfg = videoHostingConfig[hostName];
    if (!cfg || !cfg.enabled) return { hostName, available: false, error: 'disabled' };
    const { embedBase, downloadBase } = getHostBaseUrls(hostName);

    for (const [apiCfg, timeout] of [[cfg.primary, timeoutConfig.primaryTimeout], [cfg.fallback, timeoutConfig.fallbackTimeout]]) {
        try {
            const videos = await fetchAllPagesLive(apiCfg.endpoint, apiCfg.headers, timeout);
            for (const v of videos) {
                const parsed = parseVideoFilename(v.name || v.title || '');
                if (liveScanMatchContent(tmdbData, parsed)) {
                    return {
                        hostName,
                        available: true,
                        embedUrl: `${embedBase}${v.id}`,
                        downloadUrl: `${downloadBase}${v.id}&dl=1`,
                        source: 'live-scan',
                    };
                }
            }
        } catch (e) {
            console.warn(`[live-scan] ${hostName}: ${e.message}`);
        }
    }
    return { hostName, available: false, error: 'No match found' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export: fetchAllHosts
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchAllHosts(tmdbData) {
    const cacheKey = `vh:${tmdbData.type}:${tmdbData.title}:${tmdbData.year || ''}:${tmdbData.season || ''}:${tmdbData.episode || ''}`;

    // 1. In-memory cache (10 min)
    const cached = cacheGet(cacheKey);
    if (cached) {
        console.log(`[cache HIT] ${cacheKey}`);
        return cached;
    }

    // 2. Index lookup (instant — O(1))
    if (isIndexReady()) {
        const result = indexLookup(tmdbData);
        console.log(`[index] ${cacheKey} → ${result ? result.availableCount : 0} servers`);
        if (result && result.availableCount > 0) {
            cacheSet(cacheKey, result, TTL.VIDEO_RESULT);
            return result;
        }
        // Index is ready but nothing found — still cache the miss to avoid repeat lookups
        const emptyResult = { servers: {}, availableCount: 0, tmdbData, source: 'index-miss' };
        cacheSet(cacheKey, emptyResult, 5 * 60 * 1000); // 5-min miss cache
        return emptyResult;
    }

    // 3. Live scan fallback (only on cold start before index is built)
    console.log(`[live-scan] Index not ready yet, scanning live for: ${tmdbData.title}`);
    const hosts = ['streamp2p', 'seekstreaming', 'upnshare', 'rpmshare'];

    const DEADLINE_MS = 25000;
    const deadline = new Promise(resolve => setTimeout(() => resolve('DEADLINE'), DEADLINE_MS));
    const scanPromise = Promise.allSettled(hosts.map(h => liveScanHost(h, tmdbData)));
    const raceResult = await Promise.race([scanPromise, deadline]);

    const settled = raceResult === 'DEADLINE'
        ? hosts.map(h => ({ status: 'fulfilled', value: { hostName: h, available: false, error: 'Timeout' } }))
        : raceResult;

    const servers = {};
    settled.forEach(r => {
        const v = r.status === 'fulfilled' ? r.value : { hostName: 'unknown', available: false };
        if (v.hostName) servers[v.hostName] = v;
    });

    const availableCount = Object.values(servers).filter(s => s.available).length;
    const finalResult = { servers, availableCount, tmdbData, source: 'live-scan' };

    if (availableCount > 0) cacheSet(cacheKey, finalResult, TTL.VIDEO_RESULT);
    return finalResult;
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-export matchContent for any legacy callers
// ─────────────────────────────────────────────────────────────────────────────
export function matchContent(tmdbData, parsed) {
    return liveScanMatchContent(tmdbData, parsed);
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy export kept for compatibility
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchFromHost(hostName, tmdbData) {
    return liveScanHost(hostName, tmdbData);
}
