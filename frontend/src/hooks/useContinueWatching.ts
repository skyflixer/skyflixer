import { useState, useEffect } from "react";
import { getContinueWatching, ContinueWatchingItem } from "@/lib/storage";

export function useContinueWatching() {
    const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>([]);

    useEffect(() => {
        // Initial load
        setContinueWatching(getContinueWatching());

        // Listen for storage updates
        const handleStorageUpdate = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (customEvent.detail?.key === "skyflix_continue_watching") {
                setContinueWatching(getContinueWatching());
            }
        };

        window.addEventListener("skyflix_storage_update", handleStorageUpdate);

        // Also listen for standard storage event (cross-tab)
        const handleNativeStorage = (event: StorageEvent) => {
            if (event.key === "skyflix_continue_watching") {
                setContinueWatching(getContinueWatching());
            }
        };

        window.addEventListener("storage", handleNativeStorage);

        return () => {
            window.removeEventListener("skyflix_storage_update", handleStorageUpdate);
            window.removeEventListener("storage", handleNativeStorage);
        };
    }, []);

    return continueWatching;
}
