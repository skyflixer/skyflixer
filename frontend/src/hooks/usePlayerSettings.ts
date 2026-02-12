import { useState, useEffect } from 'react';
import { BACKEND_URL } from '../config';

export function usePlayerSettings() {
    const [defaultPlayer, setDefaultPlayer] = useState<string>('streamp2p');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch(`${BACKEND_URL}/api/admin/player-settings`);
                const data = await response.json();
                if (data.success && data.data.defaultPlayer) {
                    setDefaultPlayer(data.data.defaultPlayer);
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
