// Utility to dynamically load ad scripts bypassing adblockers
export const loadAdScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Create script element dynamically
        const script = document.createElement('script');

        // Randomize attributes to bypass adblocker detection
        const randomId = `s${Math.random().toString(36).substring(2, 15)}`;
        script.id = randomId;
        script.src = src;
        script.async = true;

        // Bypass common adblocker patterns
        script.setAttribute('data-cfasync', 'false');
        script.setAttribute('type', 'text/javascript');

        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

        // Append to body instead of head to bypass some adblockers
        document.body.appendChild(script);
    });
};

// Execute popunder ad
export const executePopunderAd = () => {
    const scriptUrl = 'https://confessinvaluable.com/ea/fe/b9/eafeb924d96cb9805ccfb05d00c605bc.js';

    // Use setTimeout to delay execution slightly
    setTimeout(() => {
        loadAdScript(scriptUrl).catch(err => {
            console.debug('Ad script load info:', err);
        });
    }, 100);
};

// Load native banner ad
export const loadNativeBannerAd = (containerId: string) => {
    const scriptUrl = 'https://confessinvaluable.com/dd073b3c43c53a14e009c37ccbaf45a2/invoke.js';

    // Ensure container exists
    const container = document.getElementById(containerId);
    if (!container) {
        console.debug('Ad container not found');
        return;
    }

    // Load script after a slight delay
    setTimeout(() => {
        loadAdScript(scriptUrl).catch(err => {
            console.debug('Native ad script load info:', err);
        });
    }, 150);
};
