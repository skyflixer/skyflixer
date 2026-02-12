import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ContentRow } from "@/components/ContentRow";
import { SearchOverlay } from "@/components/SearchOverlay";
import { VideoPlayerOverlay } from "@/components/VideoPlayerOverlay";
import { useWatchlist } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";
import {
  getMovieDetails,
  getMovieCredits,
  getSimilarMovies,
  getImageUrl,
  IMAGE_SIZES,
  TMDBMovieDetails,
  TMDBCredits,
  TMDBMovie,
  formatRuntime,
  getAgeRating,
  searchMovie,
} from "@/lib/tmdb";
import { Play, Plus, Check, ChevronDown, ChevronUp, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getContinueWatching } from "@/lib/storage";

export default function MovieDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [movie, setMovie] = useState<TMDBMovieDetails | null>(null);
  const [credits, setCredits] = useState<TMDBCredits | null>(null);
  const [similarMovies, setSimilarMovies] = useState<TMDBMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFullCast, setShowFullCast] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isInWatchlist, toggleWatchlist } = useWatchlist();

  useEffect(() => {
    const resolveAndLoad = async () => {
      let movieId: number | null = location.state?.id;

      if (!movieId && slug) {
        // Fallback: search by slug
        const query = slug.replace(/-/g, " ");
        const result = await searchMovie(query);
        if (result) {
          movieId = result.id;
        }
      }

      if (movieId) {
        loadMovieData(movieId);
        // Auto-play checks (URL param takes precedence, then location state)
        if (searchParams.get("play") === "true" || location.state?.openPlayer) {
          setIsPlayerOpen(true);
        }
      } else {
        setIsLoading(false); // Valid ID not found
      }
    };

    resolveAndLoad();
  }, [slug, location.state, searchParams]);

  const loadMovieData = async (movieId: number) => {
    setIsLoading(true);
    setImageLoaded(false);

    try {
      const [movieData, creditsData, similarData] = await Promise.all([
        getMovieDetails(movieId),
        getMovieCredits(movieId),
        getSimilarMovies(movieId),
      ]);

      setMovie(movieData);
      setCredits(creditsData);

      // Randomize similar movies
      const shuffled = similarData.results.sort(() => Math.random() - 0.5);
      setSimilarMovies(shuffled.slice(0, 15));
    } catch (error) {
      console.error("Failed to load movie:", error);
    }

    setIsLoading(false);
  };

  const handleWatchlistToggle = () => {
    if (!movie) return;

    const added = toggleWatchlist({
      id: movie.id,
      type: "movie",
      title: movie.title,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      overview: movie.overview,
      releaseYear: movie.release_date ? new Date(movie.release_date).getFullYear().toString() : "",
      voteAverage: movie.vote_average,
    });

    toast({
      title: added ? "Added to Watchlist" : "Removed from Watchlist",
      description: movie.title,
      duration: 2000,
    });
  };

  const inWatchlist = movie ? isInWatchlist(movie.id, "movie") : false;
  const releaseYear = movie?.release_date ? new Date(movie.release_date).getFullYear() : "";
  const director = credits?.crew.find((c) => c.job === "Director");
  const topCast = credits?.cast.slice(0, showFullCast ? 20 : 6) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onSearchClick={() => setIsSearchOpen(true)} />
        <div className="h-[60vh] md:h-[80vh] shimmer" />
        <div className="px-4 md:px-8 lg:px-12 py-8 space-y-4">
          <div className="h-8 w-64 shimmer rounded" />
          <div className="h-4 w-full max-w-2xl shimmer rounded" />
          <div className="h-4 w-full max-w-xl shimmer rounded" />
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Movie not found</h1>
          <button onClick={() => navigate(-1)} className="btn-info">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearchClick={() => setIsSearchOpen(true)} />

      {/* Hero Section */}
      <div className="relative h-[60vh] md:h-[80vh] -mt-16 md:-mt-20">
        {/* Background Image */}
        <div className="absolute inset-0">
          {!imageLoaded && <div className="absolute inset-0 shimmer" />}
          <img
            ref={(img) => {
              // If image is already loaded (cached), set imageLoaded immediately
              if (img?.complete) {
                setImageLoaded(true);
              }
            }}
            src={getImageUrl(movie.backdrop_path, IMAGE_SIZES.backdrop.original)}
            alt={movie.title}
            className={cn(
              "w-full h-full object-cover object-top transition-opacity duration-500",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)} // Show even if image fails to prevent infinite skeleton
            loading="lazy"
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
              {movie.title}
            </h1>

            {/* Tagline */}
            {movie.tagline && (
              <p className="text-lg text-muted-foreground italic">
                "{movie.tagline}"
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 text-sm md:text-base">
              {movie.vote_average > 0 && (
                <span className="text-skyflix-success font-semibold">
                  {Math.round(movie.vote_average * 10)}% Match
                </span>
              )}
              {releaseYear && (
                <span className="text-muted-foreground">{releaseYear}</span>
              )}
              {movie.runtime > 0 && (
                <span className="text-muted-foreground">{formatRuntime(movie.runtime)}</span>
              )}
              <span className="age-badge">{getAgeRating(movie.adult)}</span>
              <span className="age-badge">FHD</span>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
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
                  setIsPlayerOpen(true);
                  setSearchParams(prev => {
                    const newParams = new URLSearchParams(prev);
                    newParams.set("play", "true");
                    return newParams;
                  });
                }}
                className="btn-play text-base md:text-lg px-6 md:px-8 py-2 md:py-3"
              >
                <Play className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
                {getContinueWatching().some(item => item.id === movie.id && item.type === "movie") ? "Resume" : "Play"}
              </button>

              <button
                onClick={() => navigate(`/download/movie/${movie.id}`)}
                className="btn-info text-base md:text-lg px-6 md:px-8 py-2 md:py-3"
              >
                <Download className="w-5 h-5 md:w-6 md:h-6" />
                Download
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
            {movie.overview || "No overview available."}
          </p>
        </div>

        {/* Director & Cast */}
        <div className="space-y-4">
          {director && (
            <div>
              <span className="text-muted-foreground">Director: </span>
              <span className="font-medium">{director.name}</span>
            </div>
          )}

          {topCast.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Cast</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {topCast.map((person) => (
                  <div key={person.id} className="text-center">
                    <div className="aspect-square rounded-full overflow-hidden bg-muted mb-2 mx-auto w-20 h-20">
                      {person.profile_path ? (
                        <img
                          src={getImageUrl(person.profile_path, IMAGE_SIZES.profile.medium)}
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl text-muted-foreground">
                          {person.name[0]}
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-sm truncate">{person.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{person.character}</p>
                  </div>
                ))}
              </div>

              {credits && credits.cast.length > 6 && (
                <button
                  onClick={() => setShowFullCast(!showFullCast)}
                  className="mt-4 flex items-center gap-2 text-primary hover:underline"
                >
                  {showFullCast ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show More
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {movie.status && (
            <div>
              <span className="text-muted-foreground block">Status</span>
              <span className="font-medium">{movie.status}</span>
            </div>
          )}
          {movie.spoken_languages.length > 0 && (
            <div>
              <span className="text-muted-foreground block">Language</span>
              <span className="font-medium">{movie.spoken_languages[0].english_name}</span>
            </div>
          )}
          {movie.budget > 0 && (
            <div>
              <span className="text-muted-foreground block">Budget</span>
              <span className="font-medium">${(movie.budget / 1000000).toFixed(1)}M</span>
            </div>
          )}
          {movie.revenue > 0 && (
            <div>
              <span className="text-muted-foreground block">Revenue</span>
              <span className="font-medium">${(movie.revenue / 1000000).toFixed(1)}M</span>
            </div>
          )}
        </div>
      </div>

      {/* Similar Movies */}
      {
        similarMovies.length > 0 && (
          <div className="pb-8">
            <ContentRow
              title="More Like This"
              items={similarMovies}
            />
          </div>
        )
      }

      <Footer />

      {/* Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Video Player Overlay */}
      {movie && (
        <VideoPlayerOverlay
          isOpen={isPlayerOpen}
          onClose={() => {
            setIsPlayerOpen(false);
            setSearchParams(prev => {
              const newParams = new URLSearchParams(prev);
              newParams.delete("play");
              return newParams;
            });
          }}
          type="movie"
          id={String(movie.id)}
          poster={movie.poster_path || undefined}
          title={movie.title}
        />
      )}
    </div >
  );
}
