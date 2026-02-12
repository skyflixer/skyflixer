import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/useScroll";
import { useProfiles } from "@/hooks/useProfiles";
import { Search, Bell, Menu, X, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  onSearchClick?: () => void;
}

const NAV_LINKS = [
  { path: "/browse", label: "Home" },
  { path: "/movies", label: "Movies" },
  { path: "/tv-shows", label: "TV Shows" },
  { path: "/anime", label: "Anime" },
  { path: "/watchlist", label: "My List" },
];

export function Navbar({ onSearchClick }: NavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isScrolled } = useScroll({ threshold: 50 });
  const { currentProfile, signOut } = useProfiles();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isActive = (path: string) => {
    if (path === "/browse") {
      return location.pathname === "/browse";
    }
    return location.pathname.startsWith(path);
  };

  const handleProfileSwitch = () => {
    signOut();
    navigate("/");
  };

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled
            ? "bg-background/95 backdrop-blur-md shadow-lg"
            : "bg-gradient-to-b from-background/80 to-transparent"
        )}
      >
        <div className="flex items-center justify-between px-3 md:px-6 lg:px-8 h-14 md:h-16">
          {/* Left Section: Logo + Nav Links */}
          <div className="flex items-center gap-1 lg:gap-3">
            {/* Logo */}
            <Link to="/browse" className="flex-shrink-0">
              <img
                src="/skyflixer_logo.png"
                alt="SKYFLIXER"
                className="h-8 md:h-10 lg:h-12 w-auto object-contain transition-all duration-300"
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1 lg:gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive(link.path)
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Section: Icons */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Search */}
            <button
              onClick={() => {
                // Execute popunder ad
                import('@/lib/adLoader').then(({ executePopunderAd }) => {
                  executePopunderAd();
                });
                // Then open search
                onSearchClick?.();
              }}
              className="p-2 text-foreground hover:text-primary transition-colors focus-ring rounded-md"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications - Desktop only */}
            <button
              className="hidden md:block p-2 text-foreground hover:text-primary transition-colors focus-ring rounded-md"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* Profile Dropdown - Desktop */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-md hover:bg-muted/50 transition-colors focus-ring">
                    <img
                      src={currentProfile?.avatar || "https://i.pravatar.cc/150?img=1"}
                      alt={currentProfile?.name || "Profile"}
                      className="w-8 h-8 rounded-md object-cover"
                    />
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-popover/95 backdrop-blur-md border-border"
                >
                  <DropdownMenuItem className="cursor-pointer" disabled>
                    <span className="text-muted-foreground">
                      {currentProfile?.name || "Guest"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={handleProfileSwitch}
                  >
                    Switch Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => navigate("/watchlist")}
                  >
                    My List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-foreground hover:text-primary transition-colors focus-ring rounded-md"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/95 backdrop-blur-md z-40 md:hidden animate-fade-in"
          style={{ paddingTop: "4rem" }}
        >
          <div className="flex flex-col p-6 space-y-2">
            {/* Profile Info */}
            <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
              <img
                src={currentProfile?.avatar || "https://i.pravatar.cc/150?img=1"}
                alt={currentProfile?.name || "Profile"}
                className="w-12 h-12 rounded-md object-cover"
              />
              <div>
                <p className="font-medium">{currentProfile?.name || "Guest"}</p>
                <button
                  onClick={handleProfileSwitch}
                  className="text-sm text-primary hover:underline"
                >
                  Switch Profile
                </button>
              </div>
            </div>

            {/* Nav Links */}
            {NAV_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "px-4 py-3 text-lg font-medium rounded-md transition-colors",
                  isActive(link.path)
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Spacer for fixed navbar */}
      <div className="h-14 md:h-16" />
    </>
  );
}
