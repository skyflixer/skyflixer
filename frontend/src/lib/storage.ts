// localStorage utilities for SKYFLIXER

// Profile types
export interface Profile {
  id: string;
  name: string;
  avatar: string;
  isKids: boolean;
  createdAt: number;
}

// Watchlist item
export interface WatchlistItem {
  id: number;
  type: "movie" | "tv";
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  releaseYear: string;
  voteAverage: number;
  addedAt: number;
}

// Continue watching item
export interface ContinueWatchingItem {
  id: number;
  type: "movie" | "tv";
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  progress: number; // 0-100
  episodeInfo?: {
    seasonNumber: number;
    episodeNumber: number;
    episodeName: string;
  };
  lastWatched: number;
}

// Download link (admin-provided)
export interface DownloadLink {
  contentId: number;
  type: "movie" | "tv";
  episodeId?: number;
  quality: "480p" | "720p" | "1080p" | "4K";
  url: string;
  fileSize: string;
}

// Storage keys
const STORAGE_KEYS = {
  profiles: "skyflix_profiles",
  currentProfile: "skyflix_current_profile",
  watchlist: "skyflix_watchlist",
  continueWatching: "skyflix_continue_watching",
  recentSearches: "skyflix_recent_searches",
  downloadLinks: "skyflix_download_links",
  staticContent: "skyflix_static_content",
  version: "skyflix_version_v2", // Increment to force clear old data
} as const;

// Clear old data if version mismatch
try {
  const currentVersion = localStorage.getItem("skyflix_version");
  if (currentVersion !== "v2") {
    localStorage.removeItem(STORAGE_KEYS.profiles);
    localStorage.removeItem(STORAGE_KEYS.currentProfile);
    localStorage.setItem("skyflix_version", "v2");
  }
} catch (e) {
  console.error("Failed to clear old data", e);
}

// Default avatars
export const DEFAULT_AVATARS = [
  "/avatars/1.jpg",
  "/avatars/2.jpg",
  "/avatars/3.jpg",
  "/avatars/4.jpg",
  "/avatars/5.jpg",
];

// Generic storage utilities
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Dispatch custom event for cross-component updates
    window.dispatchEvent(new CustomEvent("skyflix_storage_update", { detail: { key, value } }));
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
  }
}

// Profile management
export function getProfiles(): Profile[] {
  return getItem<Profile[]>(STORAGE_KEYS.profiles, []);
}

export function saveProfiles(profiles: Profile[]): void {
  setItem(STORAGE_KEYS.profiles, profiles);
}

export function addProfile(profile: Omit<Profile, "id" | "createdAt">): Profile {
  const profiles = getProfiles();
  if (profiles.length >= 5) {
    throw new Error("Maximum 5 profiles allowed");
  }

  const newProfile: Profile = {
    ...profile,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };

  profiles.push(newProfile);
  saveProfiles(profiles);
  return newProfile;
}

export function updateProfile(id: string, updates: Partial<Omit<Profile, "id" | "createdAt">>): Profile | null {
  const profiles = getProfiles();
  const index = profiles.findIndex(p => p.id === id);
  if (index === -1) return null;

  profiles[index] = { ...profiles[index], ...updates };
  saveProfiles(profiles);
  return profiles[index];
}

export function deleteProfile(id: string): boolean {
  const profiles = getProfiles();
  const filtered = profiles.filter(p => p.id !== id);
  if (filtered.length === profiles.length) return false;

  saveProfiles(filtered);

  // If deleted profile was current, clear it
  if (getCurrentProfileId() === id) {
    clearCurrentProfile();
  }

  return true;
}

export function getCurrentProfileId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.currentProfile);
}

export function setCurrentProfile(profileId: string): void {
  localStorage.setItem(STORAGE_KEYS.currentProfile, profileId);
}

export function clearCurrentProfile(): void {
  localStorage.removeItem(STORAGE_KEYS.currentProfile);
}

export function getCurrentProfile(): Profile | null {
  const profileId = getCurrentProfileId();
  if (!profileId) return null;

  const profiles = getProfiles();
  return profiles.find(p => p.id === profileId) || null;
}

// Watchlist management
export function getWatchlist(): WatchlistItem[] {
  return getItem<WatchlistItem[]>(STORAGE_KEYS.watchlist, []);
}

export function addToWatchlist(item: Omit<WatchlistItem, "addedAt">): void {
  const watchlist = getWatchlist();

  // Check if already exists
  if (watchlist.some(w => w.id === item.id && w.type === item.type)) {
    return;
  }

  watchlist.unshift({ ...item, addedAt: Date.now() });
  setItem(STORAGE_KEYS.watchlist, watchlist);
}

export function removeFromWatchlist(id: number, type: "movie" | "tv"): void {
  const watchlist = getWatchlist();
  const filtered = watchlist.filter(w => !(w.id === id && w.type === type));
  setItem(STORAGE_KEYS.watchlist, filtered);
}

export function isInWatchlist(id: number, type: "movie" | "tv"): boolean {
  const watchlist = getWatchlist();
  return watchlist.some(w => w.id === id && w.type === type);
}

export type WatchlistSortOption = "recently_added" | "a_z" | "z_a" | "rating_high" | "rating_low";

export function sortWatchlist(watchlist: WatchlistItem[], sortBy: WatchlistSortOption): WatchlistItem[] {
  const sorted = [...watchlist];

  switch (sortBy) {
    case "recently_added":
      return sorted.sort((a, b) => b.addedAt - a.addedAt);
    case "a_z":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "z_a":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case "rating_high":
      return sorted.sort((a, b) => b.voteAverage - a.voteAverage);
    case "rating_low":
      return sorted.sort((a, b) => a.voteAverage - b.voteAverage);
    default:
      return sorted;
  }
}

// Continue watching management
export function getContinueWatching(): ContinueWatchingItem[] {
  return getItem<ContinueWatchingItem[]>(STORAGE_KEYS.continueWatching, []);
}

export function updateContinueWatching(item: Omit<ContinueWatchingItem, "lastWatched">): void {
  const list = getContinueWatching();
  const index = list.findIndex(w => w.id === item.id && w.type === item.type);

  let newItem: ContinueWatchingItem;

  if (index !== -1) {
    // Merge with existing item to preserve checking valid images
    const existing = list[index];
    newItem = {
      ...existing,
      ...item,
      // Critical: Don't overwrite valid images with null/undefined
      posterPath: item.posterPath || existing.posterPath,
      backdropPath: item.backdropPath || existing.backdropPath,
      // Ensure episode info is merged if partial update (though usually full object is passed)
      episodeInfo: item.episodeInfo || existing.episodeInfo,
      lastWatched: Date.now()
    };
    list.splice(index, 1); // Remove from old position
  } else {
    newItem = { ...item, lastWatched: Date.now() };
  }

  list.unshift(newItem); // Add to top

  // Keep only last 20 items
  setItem(STORAGE_KEYS.continueWatching, list.slice(0, 20));
}

export function removeFromContinueWatching(id: number, type: "movie" | "tv"): void {
  const list = getContinueWatching();
  const filtered = list.filter(w => !(w.id === id && w.type === type));
  setItem(STORAGE_KEYS.continueWatching, filtered);
}

// Recent searches
export function getRecentSearches(): string[] {
  return getItem<string[]>(STORAGE_KEYS.recentSearches, []);
}

export function addRecentSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;

  const searches = getRecentSearches();
  const filtered = searches.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
  filtered.unshift(trimmed);

  // Keep only last 10 searches
  setItem(STORAGE_KEYS.recentSearches, filtered.slice(0, 10));
}

export function clearRecentSearches(): void {
  setItem(STORAGE_KEYS.recentSearches, []);
}

export function removeRecentSearch(query: string): void {
  const searches = getRecentSearches();
  const filtered = searches.filter(s => s.toLowerCase() !== query.toLowerCase());
  setItem(STORAGE_KEYS.recentSearches, filtered);
}

// Download links (admin functionality)
export function getDownloadLinks(contentId: number, type: "movie" | "tv", episodeId?: number): DownloadLink[] {
  const all = getItem<DownloadLink[]>(STORAGE_KEYS.downloadLinks, []);
  return all.filter(d =>
    d.contentId === contentId &&
    d.type === type &&
    (episodeId === undefined || d.episodeId === episodeId)
  );
}

export function setDownloadLink(link: DownloadLink): void {
  const all = getItem<DownloadLink[]>(STORAGE_KEYS.downloadLinks, []);

  // Remove existing with same quality
  const filtered = all.filter(d => !(
    d.contentId === link.contentId &&
    d.type === link.type &&
    d.episodeId === link.episodeId &&
    d.quality === link.quality
  ));

  filtered.push(link);
  setItem(STORAGE_KEYS.downloadLinks, filtered);
}

export function removeDownloadLink(contentId: number, type: "movie" | "tv", quality: string, episodeId?: number): void {
  const all = getItem<DownloadLink[]>(STORAGE_KEYS.downloadLinks, []);
  const filtered = all.filter(d => !(
    d.contentId === contentId &&
    d.type === type &&
    d.quality === quality &&
    (episodeId === undefined || d.episodeId === episodeId)
  ));
  setItem(STORAGE_KEYS.downloadLinks, filtered);
}

// Static content (Privacy Policy, DMCA, Credits)
export interface StaticContent {
  privacyPolicy: string;
  dmca: string;
  credits: string;
}

const DEFAULT_STATIC_CONTENT: StaticContent = {
  privacyPolicy: `# Privacy Policy

We respect the privacy and online rights of all users. This website does not collect personal data unless voluntarily provided by users for communication purposes. Any technical information such as browser type, device details, or general traffic analytics may be collected automatically for improving user experience.

This website does not host or store content on its own servers. All media, links, or information displayed here are sourced from publicly accessible platforms, external service providers, or embedded from authorized third-party hosting services. We act only as an indexing service that organizes and shares links which are already available on the internet.

We rely on trusted third-party hosting services for media playback. Any data collected by those external services is managed according to their own privacy policies. We do not have control over or access to any user data handled by third parties.


## **No Ownership & Compliance Statement**

We do not claim ownership of any externally sourced content. If any material is found to be unauthorized or harmful in any manner, concerned rights owners are encouraged to contact us. We will review the complaint and take appropriate action promptly, respecting all legal requirements and intellectual property rights.


## **Cookies & Tracking**

Some third-party services may use cookies or analytical tools to enhance functionality and measure website performance. Users may disable cookies in their browser settings if they choose.


## **Policy Modifications**

We may update or revise this privacy policy at any time. Continued use of this website implies acceptance of the latest version of this policy.`,

  dmca: `# DMCA Notice

We fully respect the intellectual property rights of all content owners. If you believe that any material on this website violates your copyright or is posted without proper authorization, please contact us with valid evidence of ownership. Upon receiving your request, we will review the matter and take necessary action within 48 hours.

## 📩 Contact for DMCA Requests

**Email:** [skyflixpro@proton.me](https://mail.google.com/mail/?view=cm&fs=1&to=skyflixpro@proton.me)`,

  credits: `# Credits

> *"All Our Post Are Collected From Multiple Uploaders/Rippers."*

## Special Thanks to Content Sources

We acknowledge and thank the following uploaders, rippers, and content providers whose work makes this platform possible:

**1337x**, **Archie**, **Telly**, **ShiNobi**, **DNK**, **BunnyJMB**, **Arya**, **Spidey**, **Dexter**, **Immortal**, **Ranvijay**, **BWT**, **Dr.Star**, **Sharespark**, **Cybertron**, **$id**, **HDC**, **GameData**, **1xBet**, **DDHRipz**, **DVDWorld**, **TRC**, **Saon** and all **Original Post Uploaders**.`,
};

export function getStaticContent(): StaticContent {
  return getItem<StaticContent>(STORAGE_KEYS.staticContent, DEFAULT_STATIC_CONTENT);
}

export function updateStaticContent(key: keyof StaticContent, content: string): void {
  const current = getStaticContent();
  current[key] = content;
  setItem(STORAGE_KEYS.staticContent, current);
}

export function resetStaticContent(): void {
  setItem(STORAGE_KEYS.staticContent, DEFAULT_STATIC_CONTENT);
}
