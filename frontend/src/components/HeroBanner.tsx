import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { getImageUrl, IMAGE_SIZES, TMDBMovie, TMDBTVShow, isMovie, getTitle, getReleaseYear, createSlug } from "@/lib/tmdb";
import { Play, Info, Plus, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWatchlist } from "@/hooks/useWatchlist";
import { toast } from "@/hooks/use-toast";

interface HeroBannerProps {
  items?: (TMDBMovie | TMDBTVShow)[];
  item?: TMDBMovie | TMDBTVShow | null;
  isLoading?: boolean;
  className?: string;
}

export function HeroBanner({ items, item, isLoading = false, className }: HeroBannerProps) {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  // Use items array if provided, otherwise fall back to single item
  const heroItems = items && items.length > 0 ? items : (item ? [item] : []);
  const currentItem = heroItems[currentIndex] || null;

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    if (isHovered || heroItems.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === heroItems.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered, heroItems.length]);


  if (isLoading || !currentItem) {
    return (
      <div className={cn("relative h-[60vh] md:h-[80vh] shimmer", className)} />
    );
  }

  const mediaType = isMovie(currentItem) ? "movie" : "tv";
  const title = getTitle(currentItem);
  const releaseYear = getReleaseYear(currentItem);
  const inWatchlist = isInWatchlist(currentItem.id, mediaType);

  const handlePlayClick = () => {
    navigate(`/${mediaType}/${createSlug(title)}`, { state: { id: currentItem.id } });
  };

  const handleInfoClick = () => {
    navigate(`/${mediaType}/${createSlug(title)}`, { state: { id: currentItem.id } });
  };

  const handleWatchlistClick = () => {
    const added = toggleWatchlist({
      id: currentItem.id,
      type: mediaType,
      title,
      posterPath: currentItem.poster_path,
      backdropPath: currentItem.backdrop_path,
      overview: currentItem.overview,
      releaseYear,
      voteAverage: currentItem.vote_average,
    });

    toast({
      title: added ? "Added to Watchlist" : "Removed from Watchlist",
      description: title,
      duration: 2000,
    });
  };

  return (
    <div
      className={cn("relative h-[60vh] md:h-[80vh] overflow-hidden mb-20 md:mb-32", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {!imageLoaded && <div className="absolute inset-0 shimmer" />}
        <img
          src={getImageUrl(currentItem.backdrop_path, IMAGE_SIZES.backdrop.original)}
          alt={title}
          className={cn(
            "w-full h-full object-cover object-top transition-opacity duration-700",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute bottom-0 left-0 right-0 h-32 gradient-overlay-bottom from-transparent via-background/50 to-background" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 lg:p-12 pb-16 md:pb-24">
        <div className="max-w-2xl space-y-4 animate-fade-in">
          {/* Title */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            {title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-3 text-sm md:text-base">
            {currentItem.vote_average > 0 && (
              <span className="text-skyflix-success font-semibold">
                {Math.round(currentItem.vote_average * 10)}% Match
              </span>
            )}
            {releaseYear && (
              <span className="text-muted-foreground">{releaseYear}</span>
            )}
            <span className="age-badge">13+</span>
            <span className="age-badge">FHD</span>
          </div>

          {/* Overview */}
          <p className="text-sm md:text-base lg:text-lg text-foreground/90 line-clamp-3 max-w-xl">
            {currentItem.overview}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handlePlayClick}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 md:px-8 py-2 md:py-3 rounded-md flex items-center gap-2 transition-colors text-base md:text-lg"
            >
              <Play className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
              Play
            </button>

            <button
              onClick={handleInfoClick}
              className="btn-info text-base md:text-lg px-6 md:px-8 py-2 md:py-3"
            >
              <Info className="w-5 h-5 md:w-6 md:h-6" />
              More Info
            </button>

            <button
              onClick={handleWatchlistClick}
              className="btn-icon w-12 h-12"
              aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
            >
              {inWatchlist ? (
                <Check className="w-6 h-6" />
              ) : (
                <Plus className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Dots (only show if multiple items) */}
      {heroItems.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {heroItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                idx === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/40 hover:bg-white/60"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
