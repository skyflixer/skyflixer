import axios from 'axios';
import { videoHostingConfig, timeoutConfig } from '../config/videohosting.config.js';

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
 * Fetch video from a single hosting service
 * Tries primary API first, falls back to fallback API on failure
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

    // Try primary API first
    try {
        console.log(`[${hostName}] Trying primary API...`);

        // Fetch ALL videos (Streamp2p pattern - no query params, get full list)
        const response = await axios.get(config.primary.endpoint, {
            headers: config.primary.headers,
            timeout: timeoutConfig.primaryTimeout,
        });

        // Response can be either array directly or object with results/data field
        let videos = [];
        if (Array.isArray(response.data)) {
            videos = response.data;
        } else if (response.data.results && Array.isArray(response.data.results)) {
            videos = response.data.results;
        } else if (response.data.data && Array.isArray(response.data.data)) {
            videos = response.data.data;
        }

        console.log(`[${hostName}] Primary API returned ${videos.length} videos`);

        // Find matching video by looping through all
        for (const video of videos) {
            const parsed = parseVideoTitle(video.name || video.title);

            if (matchContent(tmdbData, parsed)) {
                console.log(`[${hostName}] Match found in primary API:`, video.name || video.title);
                console.log(`[${hostName}] Video ID:`, video.id);

                // Make a second API call to get FULL video details (includes embed/download)
                try {
                    console.log(`[${hostName}] Fetching full video details for ID: ${video.id}`);
                    const detailsResponse = await axios.get(`${config.primary.endpoint}/${video.id}`, {
                        headers: config.primary.headers,
                        timeout: timeoutConfig.primaryTimeout,
                    });

                    const fullVideo = detailsResponse.data;
                    console.log(`[${hostName}] Full video details retrieved`);
                    console.log(`[${hostName}] Embed:`, fullVideo.embed ? 'FOUND' : 'EMPTY');
                    console.log(`[${hostName}] Download:`, fullVideo.download ? 'FOUND' : 'EMPTY');

                    // Extract or construct embed URL
                    let embedUrl = extractEmbedUrl(fullVideo.embed || fullVideo.embedUrl || '');

                    // If still no embed URL, construct it from ID based on host
                    if (!embedUrl && video.id) {
                        if (hostName === 'streamp2p') {
                            embedUrl = `https://skyflixerpro.p2pplay.pro/#${video.id}`;
                        } else if (hostName === 'seekstreaming') {
                            embedUrl = `https://skyflixer.seekplayer.me/#${video.id}`;
                        } else if (hostName === 'upnshare') {
                            embedUrl = `https://skyflixer.upn.one/#${video.id}`;
                        } else if (hostName === 'rpmshare') {
                            embedUrl = `https://skyflixer.rpmplay.me/#${video.id}`;
                        }
                        console.log(`[${hostName}] Constructed embed URL from ID:`, embedUrl);
                    }

                    // Extract or construct download URL
                    let downloadUrl = fullVideo.download || fullVideo.downloadUrl || fullVideo.premiumDownload || '';

                    // If still no download URL, construct it from ID based on host
                    if (!downloadUrl && video.id) {
                        if (hostName === 'streamp2p') {
                            downloadUrl = `https://skyflixerpro.p2pplay.pro/#${video.id}&dl=1`;
                        } else if (hostName === 'seekstreaming') {
                            downloadUrl = `https://skyflixer.seekplayer.me/#${video.id}&dl=1`;
                        } else if (hostName === 'upnshare') {
                            downloadUrl = `https://skyflixer.upn.one/#${video.id}&dl=1`;
                        } else if (hostName === 'rpmshare') {
                            downloadUrl = `https://skyflixer.rpmplay.me/#${video.id}&dl=1`;
                        }
                        console.log(`[${hostName}] Constructed download URL from ID:`, downloadUrl);
                    }

                    return {
                        hostName,
                        available: true,
                        embedUrl,
                        downloadUrl,
                        source: 'primary',
                        videoData: {
                            id: video.id,
                            name: fullVideo.name || video.name || video.title,
                            ...parsed,
                        },
                    };
                } catch (detailsError) {
                    console.error(`[${hostName}] Failed to fetch full details, using constructed URLs:`, detailsError.message);

                    // Fallback: construct URLs from ID
                    return {
                        hostName,
                        available: true,
                        embedUrl: `https://skyflixerpro.p2pplay.pro/#${video.id}`,
                        downloadUrl: `https://skyflixerpro.p2pplay.pro/#${video.id}&dl=1`,
                        source: 'primary',
                        videoData: {
                            id: video.id,
                            name: video.name || video.title,
                            ...parsed,
                        },
                    };
                }
            }
        }

        console.log(`[${hostName}] No match found in primary API`);
        throw new Error('No matching video found in primary API');

    } catch (primaryError) {
        console.log(`[${hostName}] Primary API failed:`, primaryError.message);

        // Try fallback API
        try {
            console.log(`[${hostName}] Trying fallback API...`);

            // Fetch ALL videos from fallback
            const response = await axios.get(config.fallback.endpoint, {
                headers: config.fallback.headers,
                timeout: timeoutConfig.fallbackTimeout,
            });

            // Parse response array
            let videos = [];
            if (Array.isArray(response.data)) {
                videos = response.data;
            } else if (response.data.results && Array.isArray(response.data.results)) {
                videos = response.data.results;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                videos = response.data.data;
            }

            console.log(`[${hostName}] Fallback API returned ${videos.length} videos`);

            // Find matching video
            for (const video of videos) {
                const parsed = parseVideoTitle(video.name || video.title);

                if (matchContent(tmdbData, parsed)) {
                    console.log(`[${hostName}] Match found in fallback API:`, video.name || video.title);
                    console.log(`[${hostName}] Video ID:`, video.id);

                    // Make a second API call to get FULL video details (includes embed/download)
                    try {
                        console.log(`[${hostName}] Fetching full video details for ID: ${video.id}`);
                        const detailsResponse = await axios.get(`${config.fallback.endpoint}/${video.id}`, {
                            headers: config.fallback.headers,
                            timeout: timeoutConfig.fallbackTimeout,
                        });

                        const fullVideo = detailsResponse.data;
                        console.log(`[${hostName}] Full video details retrieved from fallback`);
                        console.log(`[${hostName}] Embed:`, fullVideo.embed ? 'FOUND' : 'EMPTY');
                        console.log(`[${hostName}] Download:`, fullVideo.download ? 'FOUND' : 'EMPTY');

                        // Extract or construct embed URL
                        let embedUrl = extractEmbedUrl(fullVideo.embed || fullVideo.embedUrl || '');

                        // If still no embed URL, construct it from ID (p2pplay.pro format)
                        if (!embedUrl && video.id) {
                            embedUrl = `https://skyflixerpro.p2pplay.pro/#${video.id}`;
                            console.log(`[${hostName}] Constructed embed URL from ID:`, embedUrl);
                        }

                        // Extract or construct download URL
                        let downloadUrl = fullVideo.download || fullVideo.downloadUrl || fullVideo.premiumDownload || '';

                        // If still no download URL, construct it from ID (p2pplay.pro download format)
                        if (!downloadUrl && video.id) {
                            downloadUrl = `https://skyflixerpro.p2pplay.pro/#${video.id}&dl=1`;
                            console.log(`[${hostName}] Constructed download URL from ID:`, downloadUrl);
                        }

                        return {
                            hostName,
                            available: true,
                            embedUrl,
                            downloadUrl,
                            source: 'fallback',
                            videoData: {
                                id: video.id,
                                name: fullVideo.name || video.name || video.title,
                                ...parsed,
                            },
                        };
                    } catch (detailsError) {
                        console.error(`[${hostName}] Failed to fetch full details from fallback, using constructed URLs:`, detailsError.message);

                        // Fallback: construct URLs from ID based on host
                        let embedUrl = `https://skyflixerpro.p2pplay.pro/#${video.id}`;
                        let downloadUrl = `https://skyflixerpro.p2pplay.pro/#${video.id}&dl=1`;

                        if (hostName === 'seekstreaming') {
                            embedUrl = `https://skyflixer.seekplayer.me/#${video.id}`;
                            downloadUrl = `https://skyflixer.seekplayer.me/#${video.id}&dl=1`;
                        } else if (hostName === 'upnshare') {
                            embedUrl = `https://skyflixer.upn.one/#${video.id}`;
                            downloadUrl = `https://skyflixer.upn.one/#${video.id}&dl=1`;
                        } else if (hostName === 'rpmshare') {
                            embedUrl = `https://skyflixer.rpmplay.me/#${video.id}`;
                            downloadUrl = `https://skyflixer.rpmplay.me/#${video.id}&dl=1`;
                        }

                        return {
                            hostName,
                            available: true,
                            embedUrl,
                            downloadUrl,
                            source: 'fallback',
                            videoData: {
                                id: video.id,
                                name: video.name || video.title,
                                ...parsed,
                            },
                        };
                    }
                }
            }

            console.log(`[${hostName}] No match found in fallback API`);
            throw new Error('No matching video found in fallback API');

        } catch (fallbackError) {
            console.error(`[${hostName}] Both APIs failed:`, fallbackError.message);
            return {
                hostName,
                available: false,
                error: `Both primary and fallback APIs failed: ${fallbackError.message}`,
            };
        }
    }
}

/**
 * Fetch from all video hosting services concurrently
 */
export async function fetchAllHosts(tmdbData) {
    console.log('Fetching from all hosts:', tmdbData);

    const hosts = ['streamp2p', 'seekstreaming', 'upnshare', 'rpmshare'];

    // Fetch from all hosts in parallel
    const promises = hosts.map(host => fetchFromHost(host, tmdbData));
    const results = await Promise.all(promises);

    // Organize results by host name
    const organizedResults = {};
    results.forEach(result => {
        organizedResults[result.hostName] = result;
    });

    // Count available servers
    const availableCount = results.filter(r => r.available).length;

    console.log(`Found ${availableCount} available server(s)`);

    return {
        servers: organizedResults,
        availableCount,
        tmdbData,
    };
}
