import React, { useState, useEffect } from 'react';
import { usePlayerSettings } from '../hooks/usePlayerSettings';
import { BACKEND_URL } from '@/config';

interface VideoPlayerOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'movie' | 'tv';
    id: string;
    season?: number;
    episode?: number;
    poster?: string;
    title?: string;
}

interface VideoServer {
    name: string;
    displayName: string;
    embedUrl: string;
    downloadUrl?: string;
    icon: string;
    color: string;
}

export function VideoPlayerOverlay({
    isOpen,
    onClose,
    type,
    id,
    season = 1,
    episode = 1,
    poster,
    title
}: VideoPlayerOverlayProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingServers, setIsFetchingServers] = useState(true);
    const [contentInfo, setContentInfo] = useState<any>(null);
    const [availableServers, setAvailableServers] = useState<VideoServer[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [currentUrl, setCurrentUrl] = useState<string>('');
    const { defaultPlayer } = usePlayerSettings();

    // Server configurations
    const serverConfigs = {
        'StreamP2P': { displayName: 'StreamP2P', icon: 'p2p', color: '#2d8cf0', meta: 'P2P Stream · ONLINE' },
        'Seekstreaming': { displayName: 'SeekStreaming', icon: 'seek', color: '#22c55e', meta: 'SeekStream · ONLINE' },
        'Upnshare': { displayName: 'Upnshare', icon: 'upn', color: '#fb923c', meta: 'UpnShare · ONLINE' },
        'Rpmshare': { displayName: 'Rpmshare', icon: 'rpm', color: '#ef4444', meta: 'RpmShare · ONLINE' }
    };

    // Fetch content info AND servers in parallel for fastest load
    useEffect(() => {
        if (!isOpen || !id) return;

        // Stop Lenis
        if ((window as any).lenis) (window as any).lenis.stop();

        const fetchEverything = async () => {
            setIsFetchingServers(true);

            // --- Run TMDB + Manual Post fetches in parallel ---
            const mediaType = type === 'movie' ? 'movies' : 'tv-shows';
            const manualCacheKey = `skyflix_manual:${mediaType}:${id}`;

            const getCachedManual = () => {
                try {
                    const raw = sessionStorage.getItem(manualCacheKey);
                    if (!raw) return undefined;
                    const { value, expiresAt } = JSON.parse(raw);
                    if (Date.now() > expiresAt) { sessionStorage.removeItem(manualCacheKey); return undefined; }
                    return value; // null means "confirmed not found"
                } catch { return undefined; }
            };

            const setCachedManual = (value: any) => {
                try {
                    sessionStorage.setItem(manualCacheKey, JSON.stringify({
                        value,
                        expiresAt: Date.now() + 5 * 60 * 1000, // 5 min
                    }));
                } catch { }
            };

            // Fetch TMDB and manual post simultaneously
            const cachedManual = getCachedManual();

            const [tmdbResult, manualResult] = await Promise.allSettled([
                // 1. TMDB content info
                (async () => {
                    const { getMovieDetails, getTVDetails } = await import('@/lib/tmdb');
                    return type === 'movie' ? getMovieDetails(Number(id)) : getTVDetails(Number(id));
                })(),
                // 2. Manual post (skip network if cached)
                cachedManual !== undefined
                    ? Promise.resolve(cachedManual)
                    : (async () => {
                        const res = await fetch(`${BACKEND_URL}/admin/manual-post/${mediaType}/${id}`);
                        if (res.ok) {
                            const d = await res.json();
                            const post = d.success && d.data ? d.data : null;
                            setCachedManual(post);
                            return post;
                        }
                        setCachedManual(null);
                        return null;
                    })()
            ]);

            const tmdbData = tmdbResult.status === 'fulfilled' ? tmdbResult.value : null;
            const manualPost = manualResult.status === 'fulfilled' ? manualResult.value : null;

            setContentInfo(tmdbData);

            // --- Process manual post if found ---
            if (manualPost) {
                const servers: VideoServer[] = [];
                const playerLinks = manualPost.playerLinks || manualPost.players;

                if (type === 'movie' && playerLinks) {
                    Object.keys(serverConfigs).forEach(key => {
                        const playerLink = playerLinks[key.toLowerCase()];
                        if (playerLink?.videoLink) {
                            const config = serverConfigs[key as keyof typeof serverConfigs];
                            servers.push({ name: key, displayName: config.displayName, embedUrl: playerLink.videoLink, downloadUrl: playerLink.downloadLink || undefined, icon: config.icon, color: config.color });
                        }
                    });
                } else if (type === 'tv' && manualPost.seasons) {
                    const seasonData = manualPost.seasons?.find((s: any) => s.seasonNumber === season);
                    const episodeData = seasonData?.episodes?.find((e: any) => e.episodeNumber === episode);
                    if (episodeData?.playerLinks) {
                        Object.keys(serverConfigs).forEach(key => {
                            const playerLink = episodeData.playerLinks[key.toLowerCase()];
                            if (playerLink?.videoLink) {
                                const config = serverConfigs[key as keyof typeof serverConfigs];
                                servers.push({ name: key, displayName: config.displayName, embedUrl: playerLink.videoLink, downloadUrl: playerLink.downloadLink || undefined, icon: config.icon, color: config.color });
                            }
                        });
                    }
                }

                if (servers.length > 0) {
                    setAvailableServers(servers);
                    const defaultIndex = servers.findIndex(s => s.name.toLowerCase() === defaultPlayer.toLowerCase());
                    const idx = defaultIndex >= 0 ? defaultIndex : 0;
                    setCurrentUrl(servers[idx].embedUrl);
                    setSelectedIndex(idx);
                    setIsFetchingServers(false);
                    return;
                }
            }

            // --- Fallback: video hosting API ---
            try {
                if (!tmdbData) throw new Error('No TMDB data');
                const media = tmdbData as any;
                const mediaYear = type === 'movie'
                    ? (media.release_date ? new Date(media.release_date).getFullYear() : 0)
                    : (media.first_air_date ? new Date(media.first_air_date).getFullYear() : 0);

                const response = await fetch(`${BACKEND_URL}/videohosting/fetch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: media.title || media.name,
                        year: mediaYear,
                        type: type === 'movie' ? 'movie' : 'series',
                        ...(type === 'tv' && { season, episode })
                    }),
                });

                if (!response.ok) throw new Error(`API error: ${response.status}`);
                const data = await response.json();
                const servers: VideoServer[] = [];

                Object.keys(serverConfigs).forEach(key => {
                    const serverKey = key.toLowerCase();
                    if (data.servers?.[serverKey]?.available) {
                        const config = serverConfigs[key as keyof typeof serverConfigs];
                        servers.push({ name: key, displayName: config.displayName, embedUrl: data.servers[serverKey].embedUrl, downloadUrl: data.servers[serverKey].downloadUrl, icon: config.icon, color: config.color });
                    }
                });

                setAvailableServers(servers);
                if (servers.length > 0) {
                    const defaultIndex = servers.findIndex(s => s.name.toLowerCase() === defaultPlayer.toLowerCase());
                    const idx = defaultIndex >= 0 ? defaultIndex : 0;
                    setCurrentUrl(servers[idx].embedUrl);
                    setSelectedIndex(idx);
                } else {
                    const vidsyUrl = type === 'movie'
                        ? `https://player.videasy.net/movie/${id}?overlay=true`
                        : `https://player.videasy.net/tv/${id}/${season}/${episode}?overlay=true`;
                    setCurrentUrl(vidsyUrl);
                }
            } catch (error) {
                const vidsyUrl = type === 'movie'
                    ? `https://player.videasy.net/movie/${id}?overlay=true`
                    : `https://player.videasy.net/tv/${id}/${season}/${episode}?overlay=true`;
                setCurrentUrl(vidsyUrl);
            } finally {
                setIsFetchingServers(false);
            }
        };

        fetchEverything();

        return () => {
            if ((window as any).lenis) (window as any).lenis.start();
        };
    }, [id, type, season, episode, isOpen, defaultPlayer]);

    // Track progress
    useEffect(() => {
        if (!isOpen) return;

        // Use props as primary source, fall back to fetched content
        const displayTitle = title || contentInfo?.title || contentInfo?.name;
        const displayPoster = poster || contentInfo?.poster_path || contentInfo?.poster;

        // Only save when we have both title AND poster to prevent saving incomplete data
        if (!displayTitle || !displayPoster) return;

        import("@/lib/storage").then(({ updateContinueWatching }) => {
            updateContinueWatching({
                id: Number(id),
                type: type,
                title: displayTitle,
                posterPath: displayPoster,
                backdropPath: contentInfo?.backdrop_path,
                progress: 0,
                episodeInfo: type === 'tv' ? {
                    seasonNumber: Number(season),
                    episodeNumber: Number(episode),
                    episodeName: `S${season} E${episode}`
                } : undefined
            });
        });
    }, [contentInfo, id, type, season, episode, isOpen, title, poster]);

    // Force hide loading after 1 second maximum
    useEffect(() => {
        if (!isOpen) return;

        const loadingTimeout = setTimeout(() => {
            setIsLoading(false);
            setIsFetchingServers(false);
        }, 30000); // 30s — must allow full paginated scan across all pages

        return () => clearTimeout(loadingTimeout);
    }, [isOpen]);

    // Keyboard handling
    useEffect(() => {
        if (!isOpen) return;

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showPopup) setShowPopup(false);
                else onClose();
            }
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, showPopup, onClose]);

    const selectServer = (index: number) => {
        setSelectedIndex(index);
        setCurrentUrl(availableServers[index].embedUrl);
        setIsLoading(true);
        setShowPopup(false);
    };

    // Cursor visibility logic
    const [cursorVisible, setCursorVisible] = useState(true);
    const [isHoveringIframe, setIsHoveringIframe] = useState(false);
    const cursorTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleMouseMove = () => {
            // If we are hovering the iframe, we trust the iframe's native behavior and force our wrapper to be visible (or at least not forced hidden)
            // This prevents the "stuck hidden" issue since we can't detect movement inside the iframe to wake it up.
            if (isHoveringIframe) {
                setCursorVisible(true);
                if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
                return;
            }

            setCursorVisible(true);

            if (cursorTimeoutRef.current) {
                clearTimeout(cursorTimeoutRef.current);
            }

            cursorTimeoutRef.current = setTimeout(() => {
                setCursorVisible(false);
            }, 6000); // Hide after 6 seconds of inactivity (only when interacting with our overlay UI)
        };

        // Initial setup
        handleMouseMove();

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
        };
    }, [isOpen, isHoveringIframe]); // Re-run when hover state changes

    if (!isOpen) return null;

    const getIconSVG = (iconType: string, color: string) => {
        const icons = {
            p2p: `<polygon points="5 3 19 12 5 21 5 3" fill="${color}" stroke="none"/>`,
            seek: `<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
            upn: `<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>`,
            rpm: `<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="${color}" stroke="none"/>`
        };
        return icons[iconType as keyof typeof icons] || icons.p2p;
    };

    return (
        <>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .video-spinner { animation: spin 0.8s linear infinite; }
            `}</style>

            {/* Player Wrapper */}
            <div
                className={cursorVisible ? "force-cursor-visible" : "cursor-hidden-forced"}
                style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', overflow: 'hidden' }}
            >

                {/* Loading */}
                {(isLoading || isFetchingServers) && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', zIndex: 5 }}>
                        <div style={{ width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#2d8cf0', borderRadius: '50%' }} className="video-spinner" />
                    </div>
                )}

                {/* Iframe Container - Handles Mouse Detection */}
                <div
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                    onMouseEnter={() => {
                        setIsHoveringIframe(true);
                        setCursorVisible(true); // Immediate show on enter
                    }}
                    onMouseLeave={() => {
                        setIsHoveringIframe(false);
                        // Timer will restart via mousemove event on parent
                    }}
                >
                    {currentUrl && (
                        <iframe
                            key={currentUrl}
                            src={currentUrl}
                            style={{ width: '100%', height: '100%', border: 'none' }}
                            onLoad={() => setIsLoading(false)}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                            allowFullScreen
                        />
                    )}
                </div>

                {/* Server Button - Only show if we have servers */}
                {!isFetchingServers && availableServers.length > 0 && (
                    <button
                        onClick={() => setShowPopup(!showPopup)}
                        style={{
                            position: 'absolute', top: '14px', left: '14px', zIndex: 10,
                            display: 'flex', alignItems: 'center', gap: '7px',
                            background: 'rgba(15,15,15,0.85)', backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.1)', color: '#f0f0f0',
                            padding: '7px 13px 7px 10px', borderRadius: '7px',
                            cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                            transition: 'all 0.2s', userSelect: 'none'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(30,30,30,0.95)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
                            e.currentTarget.style.transform = 'scale(1.03)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(15,15,15,0.85)';
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="3" width="20" height="4" rx="1" /><rect x="2" y="10" width="20" height="4" rx="1" /><rect x="2" y="17" width="20" height="4" rx="1" />
                        </svg>
                        Servers
                    </button>
                )}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '14px', right: '14px', zIndex: 10,
                        width: '50px', height: '50px',
                        background: 'rgba(15,15,15,0.85)', backdropFilter: 'blur(12px)',
                        border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50%',
                        color: '#fff', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(30,30,30,0.95)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(15,15,15,0.85)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                {/* Popup */}
                {showPopup && availableServers.length > 0 && (
                    <div
                        onClick={(e) => { if (e.target === e.currentTarget) setShowPopup(false); }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 100,
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <div style={{
                            background: '#161616', border: '1px solid rgba(255,255,255,0.08)',
                            borderTop: '2px solid #2d8cf0', borderRadius: '14px',
                            width: 'min(420px, 92vw)', boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
                            overflow: 'hidden'
                        }}>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                                    <div style={{ width: '38px', height: '38px', background: 'rgba(45,140,240,0.15)', border: '1px solid rgba(45,140,240,0.3)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2d8cf0" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="#2d8cf0" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: 600, color: '#f0f0f0' }}>Video Source</div>
                                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Select streaming server</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.08)', color: '#888', fontSize: '12px', fontWeight: 600, padding: '3px 9px', borderRadius: '20px' }}>
                                        {availableServers.length}
                                    </span>
                                    <button onClick={() => setShowPopup(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Server List */}
                            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {availableServers.map((server, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => selectServer(idx)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '12px 14px', borderRadius: '9px',
                                            background: selectedIndex === idx ? 'rgba(45,140,240,0.1)' : '#1e1e1e',
                                            border: `1.5px solid ${selectedIndex === idx ? '#2d8cf0' : 'transparent'}`,
                                            cursor: 'pointer', transition: 'all 0.2s', userSelect: 'none'
                                        }}
                                    >
                                        <div style={{
                                            width: '34px', height: '34px', borderRadius: '8px',
                                            background: `${server.color}18`, border: `1px solid ${server.color}80`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={server.color} strokeWidth="2.2" dangerouslySetInnerHTML={{ __html: getIconSVG(server.icon, server.color) }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 600, color: '#f0f0f0' }}>{server.displayName}</div>
                                            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                                                ONLINE
                                            </div>
                                        </div>
                                        <div style={{ position: 'relative', width: '42px', height: '24px' }}>
                                            <div style={{
                                                position: 'absolute', inset: 0,
                                                background: selectedIndex === idx ? '#2d8cf0' : '#333',
                                                borderRadius: '24px', transition: 'background 0.25s'
                                            }}>
                                                <div style={{
                                                    position: 'absolute', width: '18px', height: '18px',
                                                    borderRadius: '50%', background: '#fff', top: '3px',
                                                    left: selectedIndex === idx ? '21px' : '3px',
                                                    transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                                                }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
