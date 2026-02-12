import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getMovieDetails, getTVDetails, getImageUrl, IMAGE_SIZES } from '@/lib/tmdb';
import { fetchVideoHosting, getAvailableServers, type ServerResponse } from '@/services/videohosting.service';
import { Download, Play, ArrowLeft, Server } from 'lucide-react';

export default function DownloadPage() {
    const { type, id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const season = searchParams.get('season');
    const episode = searchParams.get('episode');

    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [downloadServers, setDownloadServers] = useState<ServerResponse[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // Fetch TMDB content info
                let tmdbData;
                if (type === 'movie') {
                    tmdbData = await getMovieDetails(parseInt(id));
                } else if (type === 'tv') {
                    tmdbData = await getTVDetails(parseInt(id));
                }

                setContent(tmdbData);

                // Fetch video hosting downloads
                if (tmdbData) {
                    const videoRequest = {
                        title: tmdbData.title || tmdbData.name,
                        type: type === 'tv' ? 'series' as const : 'movie' as const,
                        ...(type === 'movie' && {
                            year: tmdbData.release_date ? new Date(tmdbData.release_date).getFullYear() : undefined
                        }),
                        ...(type === 'tv' && season && episode && {
                            season: Number(season),
                            episode: Number(episode),
                        }),
                    };

                    try {
                        const hostingResponse = await fetchVideoHosting(videoRequest);
                        const servers = getAvailableServers(hostingResponse);
                        // Filter servers that have download URLs
                        const downloadableServers = servers.filter(s => s.downloadUrl);
                        setDownloadServers(downloadableServers);
                    } catch (error) {
                        console.error('Error fetching video hosting:', error);
                        setDownloadServers([]);
                    }
                }
            } catch (error) {
                console.error("Error fetching content:", error);
            }
            setLoading(false);
        };
        fetchData();
    }, [id, type, season, episode]);

    // Load native banner ad after content is loaded
    useEffect(() => {
        if (content) {
            const loadBannerAd = async () => {
                const { loadNativeBannerAd } = await import('@/lib/adLoader');
                loadNativeBannerAd('container-dd073b3c43c53a14e009c37ccbaf45a2');
            };
            loadBannerAd();
        }
    }, [content]);

    const getServerDisplayName = (hostName: string) => {
        const names: Record<string, string> = {
            streamp2p: 'Streamp2p',
            seekstreaming: 'SeekStreaming',
            upnshare: 'Upnshare',
            rpmshare: 'Rpmshare',
        };
        return names[hostName] || hostName;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!content) return null;

    const bgImage = getImageUrl(content.backdrop_path, IMAGE_SIZES.backdrop.original);
    const posterImage = getImageUrl(content.poster_path, IMAGE_SIZES.poster.large);
    const title = content.title || content.name;
    const releaseDate = content.release_date || content.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
    const hasDownloads = downloadServers.length > 0;

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            {/* Background with overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src={bgImage}
                    alt="Background"
                    className="w-full h-full object-cover opacity-20 blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 py-8 flex-1 flex flex-col items-center justify-center min-h-[80vh]">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                    Back
                </button>

                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start max-w-5xl w-full bg-card/30 backdrop-blur-md p-6 md:p-10 rounded-2xl border border-white/10 shadow-2xl">
                    {/* Poster */}
                    <div className="w-48 md:w-64 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl elevation-5">
                        <img
                            src={posterImage}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            {title}
                        </h1>

                        <div className="flex items-center justify-center md:justify-start gap-4 text-sm md:text-base text-gray-300">
                            <span>{year}</span>
                            <span>•</span>
                            <span>{content.vote_average?.toFixed(1)} Rating</span>
                            {type === 'tv' && season && episode && (
                                <>
                                    <span>•</span>
                                    <span className="text-primary font-semibold">S{season} E{episode}</span>
                                </>
                            )}
                        </div>


                        <p className="text-gray-300 leading-relaxed max-w-2xl">
                            {content.overview}
                        </p>

                        {/* Native Banner Ad */}
                        <div className="py-4">
                            <div id="container-dd073b3c43c53a14e009c37ccbaf45a2" className="min-h-[100px]"></div>
                        </div>

                        {/* Download Buttons */}
                        <div className="pt-6 space-y-3">
                            {hasDownloads ? (
                                <>
                                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                                        <Server className="w-4 h-4" />
                                        <span>{downloadServers.length} download server{downloadServers.length > 1 ? 's' : ''} available</span>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {downloadServers.map((server) => (
                                            <a
                                                key={server.hostName}
                                                href={server.downloadUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-3 font-bold py-4 px-8 rounded-full transition-all transform hover:scale-105 shadow-lg bg-blue-600 hover:bg-blue-700 text-white shadow-blue-900/50 w-full sm:w-auto"
                                            >
                                                <Download className="w-6 h-6" />
                                                <span>Download from {getServerDisplayName(server.hostName)}</span>
                                            </a>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-yellow-400/80 mb-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span>No download servers available at this time</span>
                                    </div>

                                    <button
                                        disabled
                                        className="flex items-center justify-center gap-3 font-bold py-4 px-8 rounded-full bg-gray-600 cursor-not-allowed text-gray-300 opacity-50 w-full sm:w-auto"
                                    >
                                        <Download className="w-6 h-6" />
                                        <span>No Download Available</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
