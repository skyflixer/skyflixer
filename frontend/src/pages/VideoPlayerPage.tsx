import React, { useState, useEffect } from 'react';
import { SEO } from '@/components/SEO';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchVideoHosting, getFirstAvailableServer, getAvailableServers, type ServerResponse } from '@/services/videohosting.service';
import { usePlayerSettings } from '@/hooks/usePlayerSettings';

export default function VideoPlayerPage() {
    const navigate = useNavigate();
    const { type, id } = useParams(); // type = 'movie' or 'tv', id = TMDB ID
    const [searchParams] = useSearchParams();

    // For TV shows: get season and episode from URL params
    const season = searchParams.get('season') || '1';
    const episode = searchParams.get('episode') || '1';

    const [isLoading, setIsLoading] = useState(true);
    const [contentInfo, setContentInfo] = useState<any>(null);
    const [availableServers, setAvailableServers] = useState<ServerResponse[]>([]);
    const [currentServer, setCurrentServer] = useState<ServerResponse | null>(null);
    const [embedUrl, setEmbedUrl] = useState('');
    const [showServerSelector, setShowServerSelector] = useState(false);
    const [videoHostingError, setVideoHostingError] = useState(false);
    const { defaultPlayer } = usePlayerSettings();

    // Fetch content info and video hosting data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Fetch TMDB content info
                const { getMovieDetails, getTVDetails } = await import("@/lib/tmdb");
                const tmdbData = type === 'movie'
                    ? await getMovieDetails(Number(id))
                    : await getTVDetails(Number(id));

                setContentInfo(tmdbData);

                // Prepare video hosting request with type guards
                const title = 'title' in tmdbData ? tmdbData.title : tmdbData.name;
                const videoRequest: any = {
                    title,
                    type: type === 'tv' ? 'series' as const : 'movie' as const,
                };

                // Add type-specific fields
                if (type === 'movie' && 'release_date' in tmdbData) {
                    videoRequest.year = tmdbData.release_date ? new Date(tmdbData.release_date).getFullYear() : undefined;
                } else if (type === 'tv') {
                    videoRequest.season = Number(season);
                    videoRequest.episode = Number(episode);
                }

                // Fetch video hosting
                const hostingResponse = await fetchVideoHosting(videoRequest);
                const servers = getAvailableServers(hostingResponse);

                setAvailableServers(servers);

                if (servers.length > 0) {
                    // Find default player
                    const defaultServer = servers.find(s =>
                        s.hostName.toLowerCase() === defaultPlayer.toLowerCase()
                    );

                    const firstServer = defaultServer || servers[0];

                    setCurrentServer(firstServer);
                    if (firstServer.embedUrl) {
                        setEmbedUrl(firstServer.embedUrl);
                        setVideoHostingError(false);
                    } else {
                        console.warn('First server has no embed URL, using Videasy.net fallback');
                        setVideoHostingError(true);
                        const fallbackUrl = type === 'movie'
                            ? `https://player.videasy.net/movie/${id}?overlay=true`
                            : `https://player.videasy.net/tv/${id}/${season}/${episode}?overlay=true`;
                        setEmbedUrl(fallbackUrl);
                    }
                } else {
                    // No servers available - fallback to Videasy.net
                    console.warn('No video hosting servers available, using Videasy.net fallback');
                    setVideoHostingError(true);
                    const fallbackUrl = type === 'movie'
                        ? `https://player.videasy.net/movie/${id}?overlay=true`
                        : `https://player.videasy.net/tv/${id}/${season}/${episode}?overlay=true`;
                    setEmbedUrl(fallbackUrl);
                }

            } catch (error) {
                console.error('Error loading video player:', error);
                setVideoHostingError(true);

                // Fallback to Videasy.net on error
                const fallbackUrl = type === 'movie'
                    ? `https://player.videasy.net/movie/${id}?overlay=true`
                    : `https://player.videasy.net/tv/${id}/${season}/${episode}?overlay=true`;
                setEmbedUrl(fallbackUrl);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, type, season, episode, defaultPlayer]);

    const handleClose = () => {
        navigate(-1);
    };

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    const switchServer = (server: ServerResponse) => {
        if (server.embedUrl) {
            setCurrentServer(server);
            setEmbedUrl(server.embedUrl);
            setIsLoading(true);
            setShowServerSelector(false);
        }
    };

    // Keyboard shortcuts and landscape lock
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showServerSelector) {
                    setShowServerSelector(false);
                } else {
                    handleClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        // Attempt landscape lock
        const lockLandscape = async () => {
            try {
                if (screen.orientation && (screen.orientation as any).lock) {
                    await (screen.orientation as any).lock("landscape");
                }
            } catch (error) {
                console.log("Landscape lock failed:", error);
            }
        };
        lockLandscape();

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            if (screen.orientation && (screen.orientation as any).unlock) {
                (screen.orientation as any).unlock();
            }
        };
    }, [showServerSelector]);

    // Track progress on mount
    useEffect(() => {
        if (!contentInfo) return;

        import("@/lib/storage").then(({ updateContinueWatching }) => {
            updateContinueWatching({
                id: Number(id),
                type: type as "movie" | "tv",
                title: contentInfo.title || contentInfo.name,
                posterPath: contentInfo.poster_path,
                backdropPath: contentInfo.backdrop_path,
                progress: 0,
                episodeInfo: type === 'tv' ? {
                    seasonNumber: Number(season),
                    episodeNumber: Number(episode),
                    episodeName: `S${season} E${episode}`
                } : undefined
            });
        });
    }, [contentInfo, id, type, season, episode]);

    const getServerDisplayName = (hostName: string) => {
        const names: Record<string, string> = {
            streamp2p: 'Streamp2p',
            seekstreaming: 'SeekStreaming',
            upnshare: 'Upnshare',
            rpmshare: 'Rpmshare',
        };
        return names[hostName] || hostName;
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
            <SEO
                title={contentInfo ? `Watch ${contentInfo.title || contentInfo.name} Free Online` : 'Watch Free Online'}
                description={`Stream ${contentInfo?.title || contentInfo?.name || 'this title'} for free in full 1080p HD on Skyflixer. No signup, no fees — just press play.`}
            />
            {/* Loading Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-gray-600 border-t-red-600 rounded-full animate-spin" />
                        <p className="text-white text-lg">Loading...</p>
                    </div>
                </div>
            )}

            {/* Close Button (X) */}
            <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-50 w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-all group backdrop-blur-sm"
                aria-label="Close video player"
            >
                <svg
                    className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:rotate-90 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            </button>

            {/* Server Selector Button */}
            {availableServers.length > 1 && (
                <button
                    onClick={() => setShowServerSelector(!showServerSelector)}
                    className="absolute top-4 left-4 z-50 px-4 py-2 bg-black/60 hover:bg-black/80 rounded-lg flex items-center gap-2 transition-all backdrop-blur-sm text-white text-sm font-medium"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                    {currentServer ? getServerDisplayName(currentServer.hostName) : 'Select Server'}
                    <span className="text-green-400">({availableServers.length})</span>
                </button>
            )}

            {/* Server Selector Modal */}
            {showServerSelector && (
                <div className="absolute top-20 left-4 z-50 bg-black/90 backdrop-blur-md rounded-lg p-4 min-w-[250px] border border-white/10">
                    <h3 className="text-white font-semibold mb-3 text-sm">Available Servers</h3>
                    <div className="space-y-2">
                        {availableServers.map((server) => (
                            <button
                                key={server.hostName}
                                onClick={() => switchServer(server)}
                                className={`w-full px-3 py-2 rounded-lg text-left transition-all ${currentServer?.hostName === server.hostName
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{getServerDisplayName(server.hostName)}</span>
                                    <span className="text-xs text-green-400">ONLINE</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Video Player Container - Responsive 16:9 Aspect Ratio */}
            <div className="relative w-full max-w-[100vw] aspect-video max-h-[100vh]">
                {embedUrl && (
                    <iframe
                        src={embedUrl}
                        title={contentInfo?.title || contentInfo?.name || 'Video Player'}
                        className="absolute top-0 left-0 w-full h-full border-none"
                        onLoad={handleIframeLoad}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        referrerPolicy="origin"
                    />
                )}
            </div>

            {/* Fallback Notice */}
            {videoHostingError && (
                <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-200 text-xs backdrop-blur-sm">
                    <p className="font-semibold">✓ Using Videasy.net Player</p>
                    <p className="text-green-300/80 mt-1">Video hosting servers not configured</p>
                </div>
            )}
        </div>
    );
}
