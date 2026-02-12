import { useState } from 'react';
import { Search, Loader2, Film, Tv, Edit2, Save, X, Plus, Trash2, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { BACKEND_URL } from '../../config';

interface SearchResult {
    id: number;
    title?: string;
    name?: string;
    poster_path?: string;
    backdrop_path?: string;
    vote_average?: number;
    release_date?: string;
    first_air_date?: string;
    overview?: string;
    media_type?: string;
}

interface PlayerLinks {
    streamp2p: { videoLink: string; downloadLink: string };
    seekstreaming: { videoLink: string; downloadLink: string };
    upnshare: { videoLink: string; downloadLink: string };
    rpmshare: { videoLink: string; downloadLink: string };
}

interface Episode {
    episodeNumber: number;
    episodeTitle: string;
    episodeDescription: string;
    episodeImage: string;
    episodeRuntime: string;
    episodeAirDate: string;
    players: PlayerLinks;
}

interface Season {
    seasonNumber: number;
    episodes: Episode[];
}

interface EditFormData {
    id: number;
    title: string;
    originalTitle: string;
    tagline: string;
    overview: string;
    year: string;
    releaseDate: string;
    status: string;
    ageRating: string;
    tmdbRating: string;
    genres: string;
    runtime: string;
    languages: string;
    countries: string;
    director: string;
    cast: string;
    productionCompanies: string;
    budget: string;
    revenue: string;
    homepage: string;
    trailerUrl: string;
    posterUrl: string;
    backdropUrl: string;
    numberOfSeasons: string;
    numberOfEpisodes: string;
    episodeRuntime: string;
}

export default function EditPostsSection() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState<'movie' | 'tv' | 'all'>('all');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selectedPost, setSelectedPost] = useState<SearchResult | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        basic: true,
        media: true,
        credits: true,
        players: true,
        seasons: true,
        advanced: false
    });

    const [formData, setFormData] = useState<EditFormData>({
        id: 0,
        title: '',
        originalTitle: '',
        tagline: '',
        overview: '',
        year: '',
        releaseDate: '',
        status: 'Released',
        ageRating: '',
        tmdbRating: '',
        genres: '',
        runtime: '',
        languages: '',
        countries: '',
        director: '',
        cast: '',
        productionCompanies: '',
        budget: '',
        revenue: '',
        homepage: '',
        trailerUrl: '',
        posterUrl: '',
        backdropUrl: '',
        numberOfSeasons: '1',
        numberOfEpisodes: '',
        episodeRuntime: ''
    });

    const [moviePlayers, setMoviePlayers] = useState<PlayerLinks>({
        streamp2p: { videoLink: '', downloadLink: '' },
        seekstreaming: { videoLink: '', downloadLink: '' },
        upnshare: { videoLink: '', downloadLink: '' },
        rpmshare: { videoLink: '', downloadLink: '' }
    });

    const [seasons, setSeasons] = useState<Season[]>([
        {
            seasonNumber: 1, episodes: [{
                episodeNumber: 1,
                episodeTitle: '',
                episodeDescription: '',
                episodeImage: '',
                episodeRuntime: '',
                episodeAirDate: '',
                players: {
                    streamp2p: { videoLink: '', downloadLink: '' },
                    seekstreaming: { videoLink: '', downloadLink: '' },
                    upnshare: { videoLink: '', downloadLink: '' },
                    rpmshare: { videoLink: '', downloadLink: '' }
                }
            }]
        }
    ]);

    const handleSearch = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            toast.error('Not authenticated. Please login again.');
            return;
        }

        if (!searchQuery.trim()) {
            toast.error('Please enter a search term');
            return;
        }

        setIsSearching(true);
        setResults([]);

        try {
            const response = await fetch(
                `${BACKEND_URL}/api/admin/search`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ query: searchQuery, type: searchType })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.message || `Search failed: ${response.status}`;
                toast.error(errorMsg);
            } else if (data.success && data.results && data.results.length > 0) {
                setResults(data.results);
                toast.success(`Found ${data.results.length} result(s)`);
            } else {
                setResults([]);
                toast.info('No results found. Try a different search term.');
            }
        } catch (error) {
            console.error('Search failed:', error);
            toast.error(error instanceof Error ? error.message : 'Search failed. Check console for details.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleEditClick = async (item: SearchResult) => {
        setSelectedPost(item);
        const isTV = item.media_type === 'tv';

        setFormData({
            id: item.id,
            title: item.title || item.name || '',
            originalTitle: '',
            tagline: '',
            overview: item.overview || '',
            year: item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || '',
            releaseDate: item.release_date || item.first_air_date || '',
            status: 'Released',
            ageRating: '',
            tmdbRating: item.vote_average?.toFixed(1) || '',
            genres: '',
            runtime: '',
            languages: '',
            countries: '',
            director: '',
            cast: '',
            productionCompanies: '',
            budget: '',
            revenue: '',
            homepage: '',
            trailerUrl: '',
            posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/original${item.poster_path}` : '',
            backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
            numberOfSeasons: '1',
            numberOfEpisodes: '',
            episodeRuntime: ''
        });

        setMoviePlayers({
            streamp2p: { videoLink: '', downloadLink: '' },
            seekstreaming: { videoLink: '', downloadLink: '' },
            upnshare: { videoLink: '', downloadLink: '' },
            rpmshare: { videoLink: '', downloadLink: '' }
        });

        if (isTV) {
            setSeasons([
                {
                    seasonNumber: 1, episodes: [{
                        episodeNumber: 1,
                        episodeTitle: '',
                        episodeDescription: '',
                        episodeImage: '',
                        episodeRuntime: '',
                        episodeAirDate: '',
                        players: {
                            streamp2p: { videoLink: '', downloadLink: '' },
                            seekstreaming: { videoLink: '', downloadLink: '' },
                            upnshare: { videoLink: '', downloadLink: '' },
                            rpmshare: { videoLink: '', downloadLink: '' }
                        }
                    }]
                }
            ]);
        }

        // LOAD EXISTING MANUAL POST FROM GITHUB
        try {
            const type = isTV ? 'tv-shows' : 'movies';
            const response = await fetch(`${BACKEND_URL}/api/admin/manual-post/${type}/${item.id}`);

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    const manualPost = data.data;

                    // Merge existing manual post data with current form data
                    setFormData(prev => ({ ...prev, ...manualPost }));

                    // Load existing movie player links (support both 'playerLinks' and 'players')
                    if (!isTV) {
                        const playerLinks = manualPost.playerLinks || manualPost.players;
                        if (playerLinks) {
                            setMoviePlayers(playerLinks);
                        }
                    }

                    // Load existing TV seasons/episodes
                    if (isTV && manualPost.seasons && manualPost.seasons.length > 0) {
                        setSeasons(manualPost.seasons);
                    }

                    toast.success('✅ Loaded existing manual post from GitHub!');
                }
            }
        } catch (error) {
            // No manual post found - that's fine, user is adding new one
            console.log('No existing manual post found, creating new');
        }
    };

    const addSeason = () => {
        const newSeasonNumber = seasons.length + 1;
        setSeasons([...seasons, {
            seasonNumber: newSeasonNumber,
            episodes: [{
                episodeNumber: 1,
                episodeTitle: '',
                episodeDescription: '',
                episodeImage: '',
                episodeRuntime: '',
                episodeAirDate: '',
                players: {
                    streamp2p: { videoLink: '', downloadLink: '' },
                    seekstreaming: { videoLink: '', downloadLink: '' },
                    upnshare: { videoLink: '', downloadLink: '' },
                    rpmshare: { videoLink: '', downloadLink: '' }
                }
            }]
        }]);
    };

    const removeSeason = (seasonIndex: number) => {
        if (seasons.length > 1) {
            setSeasons(seasons.filter((_, idx) => idx !== seasonIndex));
        }
    };

    const addEpisode = (seasonIndex: number) => {
        const newSeasons = [...seasons];
        const newEpisodeNumber = newSeasons[seasonIndex].episodes.length + 1;
        newSeasons[seasonIndex].episodes.push({
            episodeNumber: newEpisodeNumber,
            episodeTitle: '',
            episodeDescription: '',
            episodeImage: '',
            episodeRuntime: '',
            episodeAirDate: '',
            players: {
                streamp2p: { videoLink: '', downloadLink: '' },
                seekstreaming: { videoLink: '', downloadLink: '' },
                upnshare: { videoLink: '', downloadLink: '' },
                rpmshare: { videoLink: '', downloadLink: '' }
            }
        });
        setSeasons(newSeasons);
    };

    const removeEpisode = (seasonIndex: number, episodeIndex: number) => {
        const newSeasons = [...seasons];
        if (newSeasons[seasonIndex].episodes.length > 1) {
            newSeasons[seasonIndex].episodes = newSeasons[seasonIndex].episodes.filter((_, idx) => idx !== episodeIndex);
            setSeasons(newSeasons);
        }
    };

    const updateEpisodeField = (seasonIdx: number, episodeIdx: number, field: keyof Episode, value: string) => {
        const newSeasons = [...seasons];
        if (field === 'players') return; // Handle separately
        (newSeasons[seasonIdx].episodes[episodeIdx] as any)[field] = value;
        setSeasons(newSeasons);
    };

    const updateEpisodePlayer = (seasonIdx: number, episodeIdx: number, player: keyof PlayerLinks, field: 'videoLink' | 'downloadLink', value: string) => {
        const newSeasons = [...seasons];
        newSeasons[seasonIdx].episodes[episodeIdx].players[player][field] = value;
        setSeasons(newSeasons);
    };

    const handleDeletePost = async () => {
        if (!selectedPost) return;

        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${formData.title}" from GitHub?\n\nThis action cannot be undone.`
        );

        if (!confirmDelete) return;

        const token = localStorage.getItem('admin_token');
        if (!token) {
            toast.error('Not authenticated. Please login again.');
            return;
        }

        setIsDeleting(true);

        try {
            const isTV = selectedPost.media_type === 'tv';
            const type = isTV ? 'tv-shows' : 'movies';

            const response = await fetch(`${BACKEND_URL}/api/admin/delete-post`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: selectedPost.id, type })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Post deleted from GitHub successfully!');
                setSelectedPost(null);
                // Remove from search results
                setResults(results.filter(r => r.id !== selectedPost.id));
            } else {
                toast.error(data.message || 'Failed to delete post');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to delete post');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSavePost = async () => {
        if (!selectedPost) return;

        const token = localStorage.getItem('admin_token');
        if (!token) {
            toast.error('Not authenticated. Please login again.');
            return;
        }

        if (!formData.title.trim()) {
            toast.error('Title is required');
            return;
        }

        const isTV = selectedPost.media_type === 'tv';

        if (!isTV) {
            const hasPlayerLink = Object.values(moviePlayers).some(p => p.videoLink.trim() !== '');
            if (!hasPlayerLink) {
                toast.error('Please add at least one player video link');
                return;
            }
        } else {
            let hasAnyLink = false;
            for (const season of seasons) {
                for (const episode of season.episodes) {
                    if (Object.values(episode.players).some(p => p.videoLink.trim() !== '')) {
                        hasAnyLink = true;
                        break;
                    }
                }
                if (hasAnyLink) break;
            }
            if (!hasAnyLink) {
                toast.error('Please add at least one player link for at least one episode');
                return;
            }
        }

        setIsSaving(true);

        try {
            const postData = {
                id: selectedPost.id,
                ...formData,
                playerLinks: isTV ? undefined : moviePlayers,
                seasons: isTV ? seasons : undefined,
                type: isTV ? 'tv' : 'movie'
            };

            const type = isTV ? 'tv-shows' : 'movies';

            const response = await fetch(`${BACKEND_URL}/api/admin/save-post`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ postData, type })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Post saved to GitHub successfully!');
                setSelectedPost(null);
            } else {
                toast.error(data.message || 'Failed to save post');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to save post');
        } finally {
            setIsSaving(false);
        }
    };

    const updateMoviePlayer = (player: keyof PlayerLinks, field: 'videoLink' | 'downloadLink', value: string) => {
        setMoviePlayers(prev => ({
            ...prev,
            [player]: {
                ...prev[player],
                [field]: value
            }
        }));
    };

    const updateFormField = (field: keyof EditFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const isTV = selectedPost?.media_type === 'tv';

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">Edit Posts</h2>
                <p className="text-slate-400 mb-6">
                    Search for movies or TV shows from TMDB and edit ALL metadata
                </p>

                <div className="flex gap-3 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Search for movies or TV shows..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-all"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2"
                    >
                        {isSearching ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Searching...
                            </>
                        ) : (
                            'Search'
                        )}
                    </button>
                </div>

                <div className="flex gap-2">
                    {(['all', 'movie', 'tv'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setSearchType(type)}
                            className={`px-4 py-2 rounded-lg transition-all ${searchType === type
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {type === 'all' ? 'All' : type === 'movie' ? 'Movies' : 'TV Shows'}
                        </button>
                    ))}
                </div>
            </div>

            {results.length > 0 && (
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        Found {results.length} result{results.length > 1 ? 's' : ''}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {results.slice(0, 24).map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleEditClick(item)}
                                className="bg-slate-700/50 rounded-lg overflow-hidden border border-slate-600 hover:border-purple-500 transition-all cursor-pointer group"
                            >
                                <div className="aspect-[2/3] relative overflow-hidden bg-slate-900">
                                    {item.poster_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                                            alt={item.title || item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                                            {item.media_type === 'tv' ? <Tv className="w-12 h-12" /> : <Film className="w-12 h-12" />}
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                        <Edit2 className="w-6 h-6 text-white mb-1" />
                                        <span className="text-white text-xs font-medium">Edit</span>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <h4 className="text-white text-xs font-medium truncate">
                                        {item.title || item.name}
                                    </h4>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-slate-400">
                                            {item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0] || 'N/A'}
                                        </span>
                                        <div className="flex items-center gap-0.5">
                                            <span className="text-yellow-400 text-xs">★</span>
                                            <span className="text-xs text-slate-300">
                                                {item.vote_average?.toFixed(1) || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* FIXED SCROLLABLE MODAL */}
            {selectedPost && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-lg w-full max-w-6xl h-[90vh] border border-slate-700 flex flex-col">
                        {/* Fixed Header */}
                        <div className="flex-shrink-0 flex justify-between items-start p-6 border-b border-slate-700">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    {isTV ? <Tv className="inline w-6 h-6 mr-2" /> : <Film className="inline w-6 h-6 mr-2" />}
                                    Edit: {selectedPost.title || selectedPost.name}
                                </h3>
                                <p className="text-slate-400 text-sm">
                                    TMDB ID: {selectedPost.id} • Type: {isTV ? 'TV Series' : 'Movie'}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedPost(null)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div
                            className="overflow-y-auto px-6 py-6"
                            style={{
                                height: 'calc(90vh - 200px)',
                                overscrollBehavior: 'contain'
                            }}
                        >
                            <div className="space-y-4">
                                {/* Basic Info */}
                                <div className="bg-slate-700/30 rounded-lg border border-slate-600">
                                    <button
                                        onClick={() => toggleSection('basic')}
                                        className="w-full flex justify-between items-center p-4 hover:bg-slate-700/50 transition-colors"
                                    >
                                        <h4 className="text-lg font-semibold text-white">📝 Basic Information</h4>
                                        {expandedSections.basic ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                                    </button>
                                    {expandedSections.basic && (
                                        <div className="p-4 pt-0 space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm text-slate-300 mb-1">Title *</label>
                                                    <input
                                                        type="text"
                                                        value={formData.title}
                                                        onChange={(e) => updateFormField('title', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-slate-300 mb-1">Original Title</label>
                                                    <input
                                                        type="text"
                                                        value={formData.originalTitle}
                                                        onChange={(e) => updateFormField('originalTitle', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-300 mb-1">Tagline</label>
                                                <input
                                                    type="text"
                                                    value={formData.tagline}
                                                    onChange={(e) => updateFormField('tagline', e.target.value)}
                                                    placeholder="A catchy tagline..."
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-300 mb-1">Overview</label>
                                                <textarea
                                                    value={formData.overview}
                                                    onChange={(e) => updateFormField('overview', e.target.value)}
                                                    rows={3}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Media Details */}
                                <div className="bg-slate-700/30 rounded-lg border border-slate-600">
                                    <button
                                        onClick={() => toggleSection('media')}
                                        className="w-full flex justify-between items-center p-4 hover:bg-slate-700/50 transition-colors"
                                    >
                                        <h4 className="text-lg font-semibold text-white">🎬 Media Details</h4>
                                        {expandedSections.media ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                                    </button>
                                    {expandedSections.media && (
                                        <div className="p-4 pt-0 space-y-3">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-sm text-slate-300 mb-1">Year</label>
                                                    <input
                                                        type="text"
                                                        value={formData.year}
                                                        onChange={(e) => updateFormField('year', e.target.value)}
                                                        placeholder="2024"
                                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-slate-300 mb-1">Release Date</label>
                                                    <input
                                                        type="date"
                                                        value={formData.releaseDate}
                                                        onChange={(e) => updateFormField('releaseDate', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-slate-300 mb-1">Status</label>
                                                    <select
                                                        value={formData.status}
                                                        onChange={(e) => updateFormField('status', e.target.value)}
                                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                    >
                                                        <option value="Released">Released</option>
                                                        <option value="Ongoing">Ongoing</option>
                                                        <option value="Ended">Ended</option>
                                                        <option value="Upcoming">Upcoming</option>
                                                        <option value="Cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-slate-300 mb-1">Age Rating</label>
                                                    <input
                                                        type="text"
                                                        value={formData.ageRating}
                                                        onChange={(e) => updateFormField('ageRating', e.target.value)}
                                                        placeholder="PG-13, R, TV-MA"
                                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-slate-300 mb-1">TMDB Rating</label>
                                                    <input
                                                        type="text"
                                                        value={formData.tmdbRating}
                                                        onChange={(e) => updateFormField('tmdbRating', e.target.value)}
                                                        placeholder="7.5"
                                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-slate-300 mb-1">{isTV ? 'Episode Runtime (avg)' : 'Runtime'}</label>
                                                    <input
                                                        type="text"
                                                        value={isTV ? formData.episodeRuntime : formData.runtime}
                                                        onChange={(e) => updateFormField(isTV ? 'episodeRuntime' : 'runtime', e.target.value)}
                                                        placeholder={isTV ? "45 min" : "120 min"}
                                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                    />
                                                </div>
                                            </div>
                                            {isTV && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-sm text-slate-300 mb-1">Number of Seasons</label>
                                                        <input
                                                            type="text"
                                                            value={formData.numberOfSeasons}
                                                            onChange={(e) => updateFormField('numberOfSeasons', e.target.value)}
                                                            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-slate-300 mb-1">Total Episodes</label>
                                                        <input
                                                            type="text"
                                                            value={formData.numberOfEpisodes}
                                                            onChange={(e) => updateFormField('numberOfEpisodes', e.target.value)}
                                                            className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm text-slate-300 mb-1">Genres</label>
                                                    <input
                                                        type="text"
                                                        value={formData.genres}
                                                        onChange={(e) => updateFormField('genres', e.target.value)}
                                                        placeholder="Action, Drama, Sci-Fi"
                                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-slate-300 mb-1">Languages</label>
                                                    <input
                                                        type="text"
                                                        value={formData.languages}
                                                        onChange={(e) => updateFormField('languages', e.target.value)}
                                                        placeholder="English, Spanish"
                                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Credits */}
                                <div className="bg-slate-700/30 rounded-lg border border-slate-600">
                                    <button
                                        onClick={() => toggleSection('credits')}
                                        className="w-full flex justify-between items-center p-4 hover:bg-slate-700/50 transition-colors"
                                    >
                                        <h4 className="text-lg font-semibold text-white">👥 Credits & Production</h4>
                                        {expandedSections.credits ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                                    </button>
                                    {expandedSections.credits && (
                                        <div className="p-4 pt-0 space-y-3">
                                            <div>
                                                <label className="block text-sm text-slate-300 mb-1">Director / Creator</label>
                                                <input
                                                    type="text"
                                                    value={formData.director}
                                                    onChange={(e) => updateFormField('director', e.target.value)}
                                                    placeholder="Christopher Nolan"
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-300 mb-1">Cast (comma-separated)</label>
                                                <input
                                                    type="text"
                                                    value={formData.cast}
                                                    onChange={(e) => updateFormField('cast', e.target.value)}
                                                    placeholder="Leonardo DiCaprio, Tom Hardy"
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-300 mb-1">Production Companies</label>
                                                <input
                                                    type="text"
                                                    value={formData.productionCompanies}
                                                    onChange={(e) => updateFormField('productionCompanies', e.target.value)}
                                                    placeholder="Warner Bros, Legendary"
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Movie Players */}
                                {!isTV && (
                                    <div className="bg-slate-700/30 rounded-lg border border-slate-600">
                                        <button
                                            onClick={() => toggleSection('players')}
                                            className="w-full flex justify-between items-center p-4 hover:bg-slate-700/50 transition-colors"
                                        >
                                            <h4 className="text-lg font-semibold text-white">🎥 Player Links *</h4>
                                            {expandedSections.players ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                                        </button>
                                        {expandedSections.players && (
                                            <div className="p-4 pt-0 space-y-3">
                                                {(['streamp2p', 'seekstreaming', 'upnshare', 'rpmshare'] as const).map((player) => (
                                                    <div key={player} className="bg-slate-800 p-3 rounded-lg">
                                                        <h5 className="text-white font-medium mb-2 text-sm capitalize">
                                                            {player === 'streamp2p' ? 'StreamP2P' :
                                                                player === 'seekstreaming' ? 'SeekStreaming' :
                                                                    player === 'upnshare' ? 'Upnshare' : 'Rpmshare'}
                                                        </h5>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-xs text-slate-400 mb-1">Video Link</label>
                                                                <input
                                                                    type="url"
                                                                    value={moviePlayers[player].videoLink}
                                                                    onChange={(e) => updateMoviePlayer(player, 'videoLink', e.target.value)}
                                                                    placeholder={`https://${player}.com/embed/...`}
                                                                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-slate-400 mb-1">Download Link</label>
                                                                <input
                                                                    type="url"
                                                                    value={moviePlayers[player].downloadLink}
                                                                    onChange={(e) => updateMoviePlayer(player, 'downloadLink', e.target.value)}
                                                                    placeholder={`https://${player}.com/download/...`}
                                                                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TV Seasons/Episodes */}
                                {isTV && (
                                    <div className="bg-slate-700/30 rounded-lg border border-slate-600">
                                        <button
                                            onClick={() => toggleSection('seasons')}
                                            className="w-full flex justify-between items-center p-4 hover:bg-slate-700/50 transition-colors"
                                        >
                                            <h4 className="text-lg font-semibold text-white">📺 Seasons & Episodes *</h4>
                                            {expandedSections.seasons ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                                        </button>
                                        {expandedSections.seasons && (
                                            <div className="p-4 pt-0 space-y-4">
                                                {seasons.map((season, seasonIdx) => (
                                                    <div key={seasonIdx} className="bg-slate-800 p-4 rounded-lg">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <h5 className="text-white font-semibold">Season {season.seasonNumber}</h5>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => addEpisode(seasonIdx)}
                                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded flex items-center gap-1"
                                                                >
                                                                    <Plus className="w-4 h-4" />
                                                                    Add Episode
                                                                </button>
                                                                {seasons.length > 1 && (
                                                                    <button
                                                                        onClick={() => removeSeason(seasonIdx)}
                                                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded flex items-center gap-1"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                        Remove
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            {season.episodes.map((episode, episodeIdx) => (
                                                                <div key={episodeIdx} className="bg-slate-900 p-4 rounded border border-slate-700">
                                                                    <div className="flex justify-between items-center mb-3">
                                                                        <span className="text-white font-medium">Episode {episode.episodeNumber}</span>
                                                                        {season.episodes.length > 1 && (
                                                                            <button
                                                                                onClick={() => removeEpisode(seasonIdx, episodeIdx)}
                                                                                className="text-red-400 hover:text-red-300"
                                                                            >
                                                                                <Trash2 className="w-4 h-4" />
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    {/* Episode Metadata */}
                                                                    <div className="space-y-3 mb-3">
                                                                        <div>
                                                                            <label className="block text-xs text-slate-300 mb-1">Episode Title</label>
                                                                            <input
                                                                                type="text"
                                                                                value={episode.episodeTitle}
                                                                                onChange={(e) => updateEpisodeField(seasonIdx, episodeIdx, 'episodeTitle', e.target.value)}
                                                                                placeholder="Episode title"
                                                                                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-purple-500"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="block text-xs text-slate-300 mb-1">Episode Description</label>
                                                                            <textarea
                                                                                value={episode.episodeDescription}
                                                                                onChange={(e) => updateEpisodeField(seasonIdx, episodeIdx, 'episodeDescription', e.target.value)}
                                                                                placeholder="Episode description/summary"
                                                                                rows={2}
                                                                                className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-purple-500 resize-none"
                                                                            />
                                                                        </div>
                                                                        <div className="grid grid-cols-3 gap-2">
                                                                            <div>
                                                                                <label className="block text-xs text-slate-300 mb-1">Episode Image URL</label>
                                                                                <input
                                                                                    type="url"
                                                                                    value={episode.episodeImage}
                                                                                    onChange={(e) => updateEpisodeField(seasonIdx, episodeIdx, 'episodeImage', e.target.value)}
                                                                                    placeholder="https://..."
                                                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-purple-500"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-xs text-slate-300 mb-1">Runtime</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={episode.episodeRuntime}
                                                                                    onChange={(e) => updateEpisodeField(seasonIdx, episodeIdx, 'episodeRuntime', e.target.value)}
                                                                                    placeholder="45 min"
                                                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-purple-500"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-xs text-slate-300 mb-1">Air Date</label>
                                                                                <input
                                                                                    type="date"
                                                                                    value={episode.episodeAirDate}
                                                                                    onChange={(e) => updateEpisodeField(seasonIdx, episodeIdx, 'episodeAirDate', e.target.value)}
                                                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-purple-500"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Episode Players */}
                                                                    <div className="border-t border-slate-700 pt-3">
                                                                        <p className="text-xs text-slate-400 mb-2">Player Links:</p>
                                                                        <div className="space-y-2">
                                                                            {(['streamp2p', 'seekstreaming', 'upnshare', 'rpmshare'] as const).map((player) => (
                                                                                <div key={player} className="grid grid-cols-2 gap-2">
                                                                                    <input
                                                                                        type="url"
                                                                                        value={episode.players[player].videoLink}
                                                                                        onChange={(e) => updateEpisodePlayer(seasonIdx, episodeIdx, player, 'videoLink', e.target.value)}
                                                                                        placeholder={`${player} Video Link`}
                                                                                        className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                                                                                    />
                                                                                    <input
                                                                                        type="url"
                                                                                        value={episode.players[player].downloadLink}
                                                                                        onChange={(e) => updateEpisodePlayer(seasonIdx, episodeIdx, player, 'downloadLink', e.target.value)}
                                                                                        placeholder="Download Link"
                                                                                        className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}

                                                <button
                                                    onClick={addSeason}
                                                    className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                    Add Season
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Advanced */}
                                <div className="bg-slate-700/30 rounded-lg border border-slate-600">
                                    <button
                                        onClick={() => toggleSection('advanced')}
                                        className="w-full flex justify-between items-center p-4 hover:bg-slate-700/50 transition-colors"
                                    >
                                        <h4 className="text-lg font-semibold text-white">⚙️ Advanced</h4>
                                        {expandedSections.advanced ? <ChevronUp className="w-5 h-5 text-white" /> : <ChevronDown className="w-5 h-5 text-white" />}
                                    </button>
                                    {expandedSections.advanced && (
                                        <div className="p-4 pt-0 space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm text-slate-300 mb-1">Budget</label>
                                                    <input
                                                        type="text"
                                                        value={formData.budget}
                                                        onChange={(e) => updateFormField('budget', e.target.value)}
                                                        placeholder="$100,000,000"
                                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm text-slate-300 mb-1">Revenue</label>
                                                    <input
                                                        type="text"
                                                        value={formData.revenue}
                                                        onChange={(e) => updateFormField('revenue', e.target.value)}
                                                        placeholder="$500,000,000"
                                                        className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-300 mb-1">Trailer URL</label>
                                                <input
                                                    type="url"
                                                    value={formData.trailerUrl}
                                                    onChange={(e) => updateFormField('trailerUrl', e.target.value)}
                                                    placeholder="https://youtube.com/watch?v=..."
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-300 mb-1">Poster URL</label>
                                                <input
                                                    type="url"
                                                    value={formData.posterUrl}
                                                    onChange={(e) => updateFormField('posterUrl', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-300 mb-1">Backdrop URL</label>
                                                <input
                                                    type="url"
                                                    value={formData.backdropUrl}
                                                    onChange={(e) => updateFormField('backdropUrl', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Fixed Footer */}
                        <div className="flex-shrink-0 flex gap-3 p-6 border-t border-slate-700">
                            <button
                                onClick={handleSavePost}
                                disabled={isSaving || isDeleting}
                                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Saving to GitHub...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Save All to GitHub
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleDeletePost}
                                disabled={isSaving || isDeleting}
                                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-5 h-5" />
                                        Delete From GitHub
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setSelectedPost(null)}
                                disabled={isSaving || isDeleting}
                                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

