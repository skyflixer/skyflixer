import axios from 'axios';
import { videoHostingConfig, timeoutConfig } from '../config/videohosting.config.js';
import { cacheGet, cacheSet, TTL } from './cache.service.js';

/**
 * Parse video title from API response
 * Removes ignored text: {Hindi-English}, SKYFLIX, SKYFLIXER
 * Extracts year, season, episode
 */
export function parseVideoTitle(videoName) {
    if (!videoName) return null;

    let cleanName = videoName;

    // Remove content in curly braces (e.g., {Hindi-English})
    cleanName = cleanName.replace(/\{[^}]+\}/g, '').trim();

    // Remove SKYFLIX/SKYFLIXER
    cleanName = cleanName.replace(/SKYFLIX(ER)?/gi, '').trim();

    // Extract year for movies
    const yearMatch = cleanName.match(/\((\d{4})\)/);
    const year = yearMatch ? parseInt(yearMatch[1]) : null;

    // Extract season/episode for series (S01E08 format)
    const seasonMatch = cleanName.match(/S(\d+)E(\d+)/i);
    const season = seasonMatch ? parseInt(seasonMatch[1]) : null;
    const episode = seasonMatch ? parseInt(seasonMatch[2]) : null;

    // Extract title (everything before season/year)
    let title = cleanName;
    if (seasonMatch) {
        title = cleanName.split(/S\d+E\d+/i)[0].trim();
    } else if (yearMatch) {
        title = cleanName.split(/\(\d{4}\)/)[0].trim();
    }

    return {
        title: title.trim(),
        year,
        season,
        episode,
        originalName: videoName,
    };
}

/**
 * Extract embed URL from iframe code
 */
export function extractEmbedUrl(embedCode) {
    if (!embedCode) return null;

    // If already a URL, return it
    if (embedCode.startsWith('http')) {
        return embedCode;
    }

    // Extract URL from iframe src attribute
    const match = embedCode.match(/src=['"]([^'"]+)['"]/i);
    return match ? match[1] : embedCode;
}

/**
 * Match TMDB content with video hosting content
 */
export function matchContent(tmdbData, parsedVideo) {
    if (!parsedVideo || !tmdbData) return false;

    // Normalize titles for comparison (lowercase, remove special chars)
    const normalizTitle = (str) => {
        return str.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const tmdbTitle = normalizTitle(tmdbData.title);
    const videoTitle = normalizTitle(parsedVideo.title);

    // Check if titles match (exact or contains)
    const titleMatch = tmdbTitle === videoTitle ||
        videoTitle.includes(tmdbTitle) ||
        tmdbTitle.includes(videoTitle);

    if (!titleMatch) return false;

    // For movies: match title AND year
    if (tmdbData.type === 'movie') {
        return parsedVideo.year === tmdbData.year;
    }

    // For series: match title AND season AND episode
    if (tmdbData.type === 'series' || tmdbData.type === 'tv') {
        return parsedVideo.season === tmdbData.season &&
            parsedVideo.episode === tmdbData.episode;
    }

    return true;
}

/**
 * Build the correct embed and download base URL for a given host name
 */
function getHostBaseUrls(hostName) {
    switch (hostName) {
        case 'streamp2p':
            return {
                embedBase: 'https://skyflixerpro.p2pplay.pro/#',
                downloadBase: 'https://skyflixerpro.p2pplay.pro/#',
            };
        case 'seekstreaming':
            return {
                embedBase: 'https://skyflixer.seekplayer.me/#',
                downloadBase: 'https://skyflixer.seekplayer.me/#',
            };
        case 'upnshare':
            return {
                embedBase: 'https://skyflixer.upn.one/#',
                downloadBase: 'https://skyflixer.upn.one/#',
            };
        case 'rpmshare':
            return {
                embedBase: 'https://skyflixer.rpmplay.me/#',
                downloadBase: 'https://skyflixer.rpmplay.me/#',
            };
        default:
            return {
                embedBase: 'https://skyflixerpro.p2pplay.pro/#',
                downloadBase: 'https://skyflixerpro.p2pplay.pro/#',
            };
    }
}

/**
 * Fetch ALL pages from a paginated API endpoint.
 * 
 * Strategy:
 *  1. Fetch page 1.
 *  2. Determine total pages from metadata.maxPage / total_pages / last_page.
 *  3. Fetch all remaining pages in parallel.
 *  4. Return a flat array of all video objects.
 */
async function fetchAllPages(endpoint, headers, timeout) {
    // --- Page 1 ---
    const page1Response = await axios.get(endpoint, {
        params: { page: 1 },
        headers,
        timeout,
    });

    const page1Data = page1Response.data;

    // Extract videos from page 1
    let page1Videos = [];
    if (Array.isArray(page1Data)) {
        // Some APIs return a flat array (no pagination metadata)
        return page1Data;
    } else if (page1Data.data && Array.isArray(page1Data.data)) {
        page1Videos = page1Data.data;
    } else if (page1Data.results && Array.isArray(page1Data.results)) {
        page1Videos = page1Data.results;
    }

    // --- Determine total pages ---
    const meta = page1Data.metadata || page1Data.meta || page1Data;
    const totalPages =
        meta.maxPage ||
        meta.max_page ||
        meta.total_pages ||
        meta.last_page ||
        meta.totalPages ||
        1;

    console.log(`[fetchAllPages] endpoint=${endpoint} totalPages=${totalPages}`);

    if (totalPages <= 1) {
        return page1Videos;
    }

    // --- Fetch remaining pages in parallel ---
    const pageNumbers = [];
    for (let p = 2; p <= totalPages; p++) {
        pageNumbers.push(p);
    }

    const pageResponses = await Promise.all(
        pageNumbers.map(p =>
            axios.get(endpoint, {
                params: { page: p },
                headers,
                timeout,
            }).catch(err => {
                console.warn(`[fetchAllPages] p=${p} failed: ${err.message}`);
                return null;
            })
        )
    );

    // Combine all videos
    let allVideos = [...page1Videos];
    for (const res of pageResponses) {
        if (!res) continue;
        const d = res.data;
        if (d.data && Array.isArray(d.data)) {
            allVideos = allVideos.concat(d.data);
        } else if (d.results && Array.isArray(d.results)) {
            allVideos = allVideos.concat(d.results);
        } else if (Array.isArray(d)) {
            allVideos = allVideos.concat(d);
        }
    }

    console.log(`[fetchAllPages] total videos fetched: ${allVideos.length}`);
    return allVideos;
}

/**
 * Build full video result after a match is found.
 * Fetches the video detail endpoint to get embed/download URLs.
 */
async function buildVideoResult(hostName, video, apiEndpoint, headers, timeout) {
    const { embedBase, downloadBase } = getHostBaseUrls(hostName);
    const parsed = parseVideoTitle(video.name || video.title);

    try {
        const detailsResponse = await axios.get(`${apiEndpoint}/${video.id}`, {
            headers,
            timeout,
        });

        const fullVideo = detailsResponse.data;
        console.log(`[${hostName}] Full details: embed=${fullVideo.embed ? 'FOUND' : 'EMPTY'} download=${fullVideo.download ? 'FOUND' : 'EMPTY'}`);

        const embedUrl = extractEmbedUrl(fullVideo.embed || fullVideo.embedUrl || '') ||
            `${embedBase}${video.id}`;

        const downloadUrl = fullVideo.download || fullVideo.downloadUrl || fullVideo.premiumDownload ||
            `${downloadBase}${video.id}&dl=1`;

        return {
            hostName,
            available: true,
            embedUrl,
            downloadUrl,
            videoData: {
                id: video.id,
                name: fullVideo.name || video.name || video.title,
                ...parsed,
            },
        };
    } catch (detailsError) {
        console.warn(`[${hostName}] Detail fetch failed (${detailsError.message}), constructing URLs from ID`);
        return {
            hostName,
            available: true,
            embedUrl: `${embedBase}${video.id}`,
            downloadUrl: `${downloadBase}${video.id}&dl=1`,
            videoData: {
                id: video.id,
                name: video.name || video.title,
                ...parsed,
            },
        };
    }
}

/**
 * Fetch video from a single hosting service
 * Scans ALL pages, then tries fallback if primary yields no match.
 */
export async function fetchFromHost(hostName, tmdbData) {
    const config = videoHostingConfig[hostName];

    if (!config || !config.enabled) {
        return {
            hostName,
            available: false,
            error: `${hostName} is not enabled`,
        };
    }

    // ── PRIMARY ──────────────────────────────────────────────────────────────
    try {
        console.log(`[${hostName}] Scanning ALL pages on primary API...`);

        const videos = await fetchAllPages(
            config.primary.endpoint,
            config.primary.headers,
            timeoutConfig.primaryTimeout
        );

        console.log(`[${hostName}] Primary API: ${videos.length} total videos across all pages`);

        for (const video of videos) {
            const parsed = parseVideoTitle(video.name || video.title);
            if (matchContent(tmdbData, parsed)) {
                console.log(`[${hostName}] Match found in primary: "${video.name || video.title}" (id=${video.id})`);
                const result = await buildVideoResult(
                    hostName, video,
                    config.primary.endpoint,
                    config.primary.headers,
                    timeoutConfig.primaryTimeout
                );
                return { ...result, source: 'primary' };
            }
        }

        console.log(`[${hostName}] No match found in primary API`);
        throw new Error('No matching video found in primary API');

    } catch (primaryError) {
        console.log(`[${hostName}] Primary failed: ${primaryError.message}`);

        // ── FALLBACK ──────────────────────────────────────────────────────────
        try {
            console.log(`[${hostName}] Scanning ALL pages on fallback API...`);

            const videos = await fetchAllPages(
                config.fallback.endpoint,
                config.fallback.headers,
                timeoutConfig.fallbackTimeout
            );

            console.log(`[${hostName}] Fallback API: ${videos.length} total videos across all pages`);

            for (const video of videos) {
                const parsed = parseVideoTitle(video.name || video.title);
                if (matchContent(tmdbData, parsed)) {
                    console.log(`[${hostName}] Match found in fallback: "${video.name || video.title}" (id=${video.id})`);
                    const result = await buildVideoResult(
                        hostName, video,
                        config.fallback.endpoint,
                        config.fallback.headers,
                        timeoutConfig.fallbackTimeout
                    );
                    return { ...result, source: 'fallback' };
                }
            }

            console.log(`[${hostName}] No match found in fallback API`);
            throw new Error('No matching video found in fallback API');

        } catch (fallbackError) {
            console.error(`[${hostName}] Both APIs exhausted: ${fallbackError.message}`);
            return {
                hostName,
                available: false,
                error: `Both primary and fallback APIs failed: ${fallbackError.message}`,
            };
        }
    }
}

/**
 * Fetch from all video hosting services concurrently.
 * Results are cached per (title+type+year/season/episode) for 10 minutes.
 */
export async function fetchAllHosts(tmdbData) {
    // Build a deterministic cache key
    const cacheKey = `vh:${tmdbData.type}:${tmdbData.title}:${tmdbData.year || ''}:${tmdbData.season || ''}:${tmdbData.episode || ''}`;

    const cached = cacheGet(cacheKey);
    if (cached) {
        console.log(`[cache HIT] ${cacheKey}`);
        return cached;
    }

    console.log(`[cache MISS] Fetching from all hosts for:`, tmdbData);

    const hosts = ['streamp2p', 'seekstreaming', 'upnshare', 'rpmshare'];

    // Fetch from all hosts in parallel
    const promises = hosts.map(host => fetchFromHost(host, tmdbData));
    const results = await Promise.all(promises);

    // Organize results by host name
    const organizedResults = {};
    results.forEach(result => {
        organizedResults[result.hostName] = result;
    });

    const availableCount = results.filter(r => r.available).length;
    console.log(`Found ${availableCount} available server(s)`);

    const finalResult = {
        servers: organizedResults,
        availableCount,
        tmdbData,
    };

    // Only cache if at least one server was found
    if (availableCount > 0) {
        cacheSet(cacheKey, finalResult, TTL.VIDEO_RESULT);
    }

    return finalResult;
}
