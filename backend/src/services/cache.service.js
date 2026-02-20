/**
 * Simple in-memory cache with TTL (time-to-live)
 * Eliminates repeated external API calls for the same content
 */

const store = new Map();

/**
 * Get a cached value. Returns null if missing or expired.
 */
export function cacheGet(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
    }
    return entry.value;
}

/**
 * Store a value in the cache with a TTL (milliseconds).
 */
export function cacheSet(key, value, ttlMs) {
    store.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
    });
}

/**
 * Delete a specific key.
 */
export function cacheDel(key) {
    store.delete(key);
}

/**
 * Clear all entries.
 */
export function cacheClear() {
    store.clear();
}

// TTL constants
export const TTL = {
    VIDEO_RESULT: 10 * 60 * 1000, // 10 minutes — video host search results
    MANUAL_POST: 5 * 60 * 1000, // 5  minutes — GitHub manual posts
    PLAYER_SETTINGS: 5 * 60 * 1000, // 5  minutes — player settings from GitHub
    GITHUB_STATUS: 2 * 60 * 1000, // 2  minutes — GitHub repo status
};
