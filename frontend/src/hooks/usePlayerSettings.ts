import { useState, useEffect } from 'react';
import { BACKEND_URL } from '../config';

const CACHE_KEY = 'skyflix_default_player';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getLocalCache(): string | null {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const { value, expiresAt } = JSON.parse(raw);
        if (Date.now() > expiresAt) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
        return value;
    } catch {
        return null;
    }
}

function setLocalCache(value: string) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            value,
            expiresAt: Date.now() + CACHE_TTL,
        }));
    } catch { /* quota exceeded — ignore */ }
}

export function usePlayerSettings() {
    // Seed from localStorage immediately — zero initial delay
    const [defaultPlayer, setDefaultPlayer] = useState<string>(() => getLocalCache() || 'streamp2p');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // If we already have a fresh cached value, skip the network call entirely
        const cached = getLocalCache();
        if (cached) {
            setDefaultPlayer(cached);
            setIsLoading(false);
            return;
        }

        const fetchSettings = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/admin/player-settings`);
                const data = await response.json();
                if (data.success && data.data.defaultPlayer) {
                    setDefaultPlayer(data.data.defaultPlayer);
                    setLocalCache(data.data.defaultPlayer);
                }
            } catch (error) {
                console.error('Failed to fetch player settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return { defaultPlayer, isLoading };
}
