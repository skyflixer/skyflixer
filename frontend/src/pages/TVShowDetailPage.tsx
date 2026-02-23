import React, { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ContentRow } from "@/components/ContentRow";
import { SearchOverlay } from "@/components/SearchOverlay";
import { VideoPlayerOverlay } from "@/components/VideoPlayerOverlay";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";
import {
  getTVDetails,
  getTVCredits,
  getTVSeasonDetails,
  getSimilarTVShows,
  getImageUrl,
  IMAGE_SIZES,
  TMDBTVDetails,
  TMDBCredits,
  TMDBEpisode,
  TMDBTVShow,
  formatRuntime,
  searchTV,
} from "@/lib/tmdb";
import { Play, Plus, Check, ChevronDown, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { getDownloadLinks, getContinueWatching } from "@/lib/storage";
export default function TVShowDetailPage() {
  const { slug, season: urlSeason, episode: urlEpisode } = useParams<{ slug: string; season?: string; episode?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [show, setShow] = useState<TMDBTVDetails | null>(null);
  const [credits, setCredits] = useState<TMDBCredits | null>(null);
  const [similarShows, setSimilarShows] = useState<TMDBTVShow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<TMDBEpisode | null>(null);
  const [videoPlayerState, setVideoPlayerState] = useState<{
    isOpen: boolean;
    season: number;
    episode: number;
  }>({
    isOpen: false,
    season: 1,
    episode: 1,
  });
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  // Track whether we've already loaded data for the current slug to prevent re-loading
  const loadedSlugRef = React.useRef<string | null>(null);
  // Read searchParams once on mount via ref so changes don't trigger re-load
  const searchParamsRef = React.useRef(searchParams);
  searchParamsRef.current = searchParams;

  // Main effect: load show data and handle initial player state
  // Does NOT depend on searchParams — only on slug/URL changes
  useEffect(() => {
    const resolveAndLoad = async () => {
      let showId: number | null = location.state?.id;

      if (!showId && slug) {
        // Fallback: search by slug
        const query = slug.replace(/-/g, " ");
        const result = await searchTV(query);
        if (result) {
          showId = result.id;
        }
      }

      if (showId) {
        // Only reload show data if the slug actually changed (not searchParams)
        const currentSlug = slug || String(showId);
        if (loadedSlugRef.current !== currentSlug) {
          loadedSlugRef.current = currentSlug;
          await loadShowData(showId);
        }

        // Check if season/episode are in URL params first, then query params
        const seasonFromUrl = urlSeason ? parseInt(urlSeason) : null;
        const episodeFromUrl = urlEpisode ? parseInt(urlEpisode) : null;
        const currentParams = searchParamsRef.current;
        const playParam = currentParams.get("play");
        const seasonParam = currentParams.get("season");
        const episodeParam = currentParams.get("episode");

        // Auto-open player if season/episode in URL
        if (seasonFromUrl && episodeFromUrl) {
          setVideoPlayerState({
            isOpen: true,
            season: seasonFromUrl,
            episode: episodeFromUrl
          });
          setSelectedSeason(seasonFromUrl);
        } else if (playParam === "true") {
          setVideoPlayerState({
            isOpen: true,
            season: seasonParam ? parseInt(seasonParam) : 1,
            episode: episodeParam ? parseInt(episodeParam) : 1
          });
          // Ensure the correct season is selected in the dropdown
          if (seasonParam) setSelectedSeason(parseInt(seasonParam));
        } else if (location.state?.openPlayer) {
          setVideoPlayerState(prev => ({ ...prev, isOpen: true }));
        }
      } else {
        setIsLoading(false); // Valid ID not found
      }
    };

    resolveAndLoad();
  }, [slug, location.state, urlSeason, urlEpisode]);


  useEffect(() => {
    if (show && selectedSeason) {
      loadEpisodes(show.id, selectedSeason);
    }
  }, [show, selectedSeason]);

  const loadShowData = async (showId: number) => {
    setIsLoading(true);
    setImageLoaded(false);

    try {
      const [showData, creditsData, similarData] = await Promise.all([
        getTVDetails(showId),
        getTVCredits(showId),
        getSimilarTVShows(showId),
      ]);

      setShow(showData);
      setCredits(creditsData);

      // Randomize similar shows - get 15 instead of 6
      const shuffled = similarData.results.sort(() => Math.random() - 0.5);
      setSimilarShows(shuffled.slice(0, 15));

      // Set initial season only on first load (not when returning from player)
      if (showData.seasons.length > 0) {
        // Default to the LATEST regular season
        const regularSeasonsList = showData.seasons.filter(s => s.season_number > 0);
        const latestSeason = regularSeasonsList[regularSeasonsList.length - 1];
        setSelectedSeason(latestSeason?.season_number || 1);
      }
    } catch (error) {
      console.error("Failed to load show:", error);
    }

    setIsLoading(false);
  };

  const loadEpisodes = async (showId: number, seasonNumber: number) => {
    setEpisodesLoading(true);

    try {
      const seasonData = await getTVSeasonDetails(showId, seasonNumber);
      setEpisodes(seasonData.episodes || []);
    } catch (error) {
      console.error("Failed to load episodes:", error);
      setEpisodes([]);
    }

    setEpisodesLoading(false);
  };

  const handleWatchlistToggle = () => {
    if (!show) return;

    const added = toggleWatchlist({
      id: show.id,
      type: "tv",
      title: show.name,
      posterPath: show.poster_path,
      backdropPath: show.backdrop_path,
      overview: show.overview,
      releaseYear: show.first_air_date ? new Date(show.first_air_date).getFullYear().toString() : "",
      voteAverage: show.vote_average,
    });

    toast({
      title: added ? "Added to Watchlist" : "Removed from Watchlist",
      description: show.name,
      duration: 2000,
    });
  };

  const handleDownloadClick = (episode: TMDBEpisode) => {
    setSelectedEpisode(episode);
    setDownloadModalOpen(true);
  };

  const inWatchlist = show ? isInWatchlist(show.id, "tv") : false;
  const releaseYear = show?.first_air_date ? new Date(show.first_air_date).getFullYear() : "";
  const creator = show?.created_by[0];
  const regularSeasons = show?.seasons.filter(s => s.season_number > 0) || [];
  const downloadLinks = show && selectedEpisode
    ? getDownloadLinks(show.id, "tv", selectedEpisode.id)
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onSearchClick={() => setIsSearchOpen(true)} />
        <div className="h-[60vh] md:h-[80vh] shimmer" />
        <div className="px-4 md:px-8 lg:px-12 py-8 space-y-4">
          <div className="h-8 w-64 shimmer rounded" />
          <div className="h-4 w-full max-w-2xl shimmer rounded" />
        </div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">TV Show not found</h1>
          <button onClick={() => navigate(-1)} className="btn-info">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`Watch ${show.name} Free in HD — All Seasons`}
        description={show.overview?.slice(0, 155) + (show.overview && show.overview.length > 155 ? '...' : '') || `Stream ${show.name} for free in full 1080p HD on Skyflixer. All seasons & episodes — no signup needed.`}
        ogImage={show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : undefined}
        ogType="video.tv_show"
      />
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />

      {/* Hero Section */}
      <div className="relative h-[60vh] md:h-[80vh] -mt-16 md:-mt-20">
        {/* Background Image */}
        <div className="absolute inset-0">
          {!imageLoaded && <div className="absolute inset-0 shimmer" />}
          <img
            ref={(img) => {
              if (img?.complete) setImageLoaded(true);
            }}
            src={getImageUrl(show.backdrop_path, IMAGE_SIZES.backdrop.large)}
            alt={show.name}
            className={cn(
              "w-full h-full object-cover object-top transition-opacity duration-300",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
            loading="eager"
            fetchpriority="high"
          />
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute bottom-0 left-0 right-0 h-48 gradient-overlay-bottom" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 lg:p-12 pb-8">
          <div className="max-w-3xl space-y-4 animate-fade-in">
            {/* Title */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              {show.name}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 text-sm md:text-base">
              {show.vote_average > 0 && (
                <span className="text-skyflix-success font-semibold">
                  {Math.round(show.vote_average * 10)}% Match
                </span>
              )}
              {releaseYear && (
                <span className="text-muted-foreground">{releaseYear}</span>
              )}
              <span className="text-muted-foreground">
                {show.number_of_seasons} Season{show.number_of_seasons !== 1 ? "s" : ""}
              </span>
              <span className="age-badge">13+</span>
              <span className="age-badge">FHD</span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {show.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="px-3 py-1 bg-muted/50 rounded-full text-sm"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  const continueWatchingItem = getContinueWatching().find(item => item.id === show.id && item.type === "tv");
                  const seasonToPlay = continueWatchingItem?.episodeInfo?.seasonNumber || 1;
                  const episodeToPlay = continueWatchingItem?.episodeInfo?.episodeNumber || 1;

                  setVideoPlayerState({ isOpen: true, season: seasonToPlay, episode: episodeToPlay });
                }}
                className="btn-play text-base md:text-lg px-6 md:px-8 py-2 md:py-3"
              >
                <Play className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
                {getContinueWatching().some(item => item.id === show.id && item.type === "tv") ? "Resume" : "Play"}
              </button>

              <button
                onClick={handleWatchlistToggle}
                className={cn(
                  "btn-info text-base md:text-lg px-6 md:px-8 py-2 md:py-3",
                  inWatchlist && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {inWatchlist ? (
                  <>
                    <Check className="w-5 h-5 md:w-6 md:h-6" />
                    In Watchlist
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 md:w-6 md:h-6" />
                    Add to Watchlist
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="px-4 md:px-8 lg:px-12 py-8 space-y-8">
        {/* Overview */}
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold mb-4">Overview</h2>
          <p className="text-muted-foreground leading-relaxed">
            {show.overview || "No overview available."}
          </p>
        </div>

        {creator && (
          <div>
            <span className="text-muted-foreground">Created by: </span>
            <span className="font-medium">{creator.name}</span>
          </div>
        )}

        {/* Episodes Section */}
        {regularSeasons.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Episodes</h2>

              {/* Season Selector */}
              <Select
                value={String(selectedSeason)}
                onValueChange={(value) => setSelectedSeason(parseInt(value))}
              >
                <SelectTrigger className="w-[180px] bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {regularSeasons.map((season) => (
                    <SelectItem key={season.season_number} value={String(season.season_number)}>
                      SEASON {String(season.season_number).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Episode List */}
            <div className="space-y-3">
              {episodesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-card rounded-lg">
                    <div className="w-40 aspect-video shimmer rounded" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-32 shimmer rounded" />
                      <div className="h-4 w-full shimmer rounded" />
                    </div>
                  </div>
                ))
              ) : episodes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No episodes available for this season.
                </p>
              ) : (
                episodes.map((episode) => (
                  <div
                    key={episode.id}
                    className="space-y-3 md:space-y-0"
                  >
                    {/* MOBILE LAYOUT (< md breakpoint) - Netflix Style */}
                    <div className="md:hidden">
                      <div
                        onClick={() => {
                          setVideoPlayerState({
                            isOpen: true,
                            season: episode.season_number,
                            episode: episode.episode_number
                          });
                        }}
                        className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-card/50 rounded-lg hover:bg-card/70 transition-colors cursor-pointer"
                      >
                        {/* Thumbnail on left */}
                        <div className="relative w-24 sm:w-28 aspect-video flex-shrink-0 rounded overflow-hidden bg-muted group/thumb">
                          {episode.still_path ? (
                            <img
                              src={getImageUrl(episode.still_path, IMAGE_SIZES.still.large)}
                              alt={episode.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              No Image
                            </div>
                          )}
                        </div>

                        {/* Episode info in center */}
                        <div
                          className="flex-1 min-w-0 space-y-0.5 sm:space-y-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setVideoPlayerState({
                              isOpen: true,
                              season: episode.season_number,
                              episode: episode.episode_number
                            });
                          }}
                        >
                          <h3 className="font-semibold text-xs sm:text-sm leading-tight text-white group-hover:text-primary transition-colors">
                            {episode.episode_number}. {episode.name}
                          </h3>
                          {episode.runtime && (
                            <p className="text-xs text-muted-foreground">
                              {formatRuntime(episode.runtime)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {episode.overview || "No description available."}
                          </p>
                        </div>

                        {/* Download button on right */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/download/tv/${show.id}?season=${episode.season_number}&episode=${episode.episode_number}`);
                          }}
                          className="p-1.5 sm:p-2 rounded-full hover:bg-muted transition-colors flex-shrink-0 self-start"
                          aria-label={`Download ${episode.name}`}
                        >
                          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>

                    {/* DESKTOP LAYOUT (>= md breakpoint) */}
                    <div
                      onClick={() => {
                        setVideoPlayerState({
                          isOpen: true,
                          season: episode.season_number,
                          episode: episode.episode_number
                        });
                      }}
                      className="hidden md:flex gap-4 p-4 bg-card rounded-lg hover:bg-card/80 transition-colors cursor-pointer"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-40 aspect-video flex-shrink-0 rounded overflow-hidden bg-muted">
                        {episode.still_path ? (
                          <img
                            src={getImageUrl(episode.still_path, IMAGE_SIZES.still.large)}
                            alt={episode.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No Image
                          </div>
                        )}

                      </div>

                      {/* Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold">
                              {episode.episode_number}. {episode.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {episode.runtime && (
                                <span>{formatRuntime(episode.runtime)}</span>
                              )}
                              {episode.air_date && (
                                <span>{new Date(episode.air_date).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>

                          {/* Download Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/download/tv/${show.id}?season=${episode.season_number}&episode=${episode.episode_number}`);
                            }}
                            className="p-2 rounded-full hover:bg-muted transition-colors"
                            aria-label={`Download ${episode.name}`}
                          >
                            <Download className="w-5 h-5" />
                          </button>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {episode.overview || "No description available."}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Similar Shows */}
      {similarShows.length > 0 && (
        <div className="pb-8">
          <ContentRow
            title="More Like This"
            items={similarShows}
          />
        </div>
      )}

      <Footer />

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Download Modal */}
      <Dialog open={downloadModalOpen} onOpenChange={setDownloadModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Download Episode</DialogTitle>
          </DialogHeader>

          {selectedEpisode && (
            <div className="space-y-4 py-4">
              <div>
                <p className="font-semibold">{show.name}</p>
                <p className="text-sm text-muted-foreground">
                  S{String(selectedEpisode.season_number).padStart(2, "0")}E{String(selectedEpisode.episode_number).padStart(2, "0")} - {selectedEpisode.name}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Select Quality:</p>

                {downloadLinks.length > 0 ? (
                  downloadLinks.map((link) => (
                    <a
                      key={link.quality}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <span className="font-medium">{link.quality}</span>
                      <span className="text-sm text-muted-foreground">{link.fileSize}</span>
                    </a>
                  ))
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg opacity-50 cursor-not-allowed">
                      <span className="font-medium">480p</span>
                      <span className="text-sm text-muted-foreground">~300 MB</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg opacity-50 cursor-not-allowed">
                      <span className="font-medium">720p FHD</span>
                      <span className="text-sm text-muted-foreground">~700 MB</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg opacity-50 cursor-not-allowed">
                      <span className="font-medium">1080p</span>
                      <span className="text-sm text-muted-foreground">~1.5 GB</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg opacity-50 cursor-not-allowed">
                      <span className="font-medium">4K</span>
                      <span className="text-sm text-muted-foreground">~4 GB</span>
                    </div>
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      Download links not available yet. Check back later.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Player Overlay */}
      {show && (
        <VideoPlayerOverlay
          isOpen={videoPlayerState.isOpen}
          onClose={() => {
            setVideoPlayerState(prev => ({ ...prev, isOpen: false }));
            setSearchParams(prev => {
              const newParams = new URLSearchParams(prev);
              newParams.delete("play");
              newParams.delete("season");
              newParams.delete("episode");
              return newParams;
            });
          }}
          type="tv"
          id={String(show.id)}
          season={videoPlayerState.season}
          episode={videoPlayerState.episode}
          poster={show.poster_path || undefined}
          title={show.name}
        />
      )}
    </div>
  );
}
