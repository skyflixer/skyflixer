import dotenv from 'dotenv';
dotenv.config();

/**
 * Video Hosting API Configuration
 * Each service has primary and fallback API configuration
 */
export const videoHostingConfig = {
    streamp2p: {
        enabled: true,
        primary: {
            endpoint: process.env.STREAMP2P_PRIMARY_ENDPOINT || 'https://streamp2p.com/api/v1/video/manage',
            apiKey: process.env.STREAMP2P_PRIMARY_KEY || 'a56bbd94407e8de1550df9cf',
            headers: {
                'api-token': process.env.STREAMP2P_PRIMARY_KEY || 'a56bbd94407e8de1550df9cf',
            },
        },
        fallback: {
            endpoint: process.env.STREAMP2P_FALLBACK_ENDPOINT || 'https://streamp2p.com/api/v1/video/manage',
            apiKey: process.env.STREAMP2P_FALLBACK_KEY || '10396bb2ed0fee13eebfe9b0',
            headers: {
                'api-token': process.env.STREAMP2P_FALLBACK_KEY || '10396bb2ed0fee13eebfe9b0',
            },
        },
    },

    seekstreaming: {
        enabled: true,  // Enabled with user-provided API keys
        primary: {
            endpoint: process.env.SEEKSTREAMING_PRIMARY_ENDPOINT || 'https://seekstreaming.com/api/v1/video/manage',
            apiKey: process.env.SEEKSTREAMING_PRIMARY_KEY || 'b3012588d81fef120b6a92f9',
            headers: {
                'api-token': process.env.SEEKSTREAMING_PRIMARY_KEY || 'b3012588d81fef120b6a92f9',
            },
        },
        fallback: {
            endpoint: process.env.SEEKSTREAMING_FALLBACK_ENDPOINT || 'https://seekstreaming.com/api/v1/video/manage',
            apiKey: process.env.SEEKSTREAMING_FALLBACK_KEY || '3133bd19d835b98def9a83d4',
            headers: {
                'api-token': process.env.SEEKSTREAMING_FALLBACK_KEY || '3133bd19d835b98def9a83d4',
            },
        },
    },

    upnshare: {
        enabled: true, // Enabled with user-provided API keys
        primary: {
            endpoint: process.env.UPNSHARE_PRIMARY_ENDPOINT || 'https://upnshare.com/api/v1/video/manage',
            apiKey: process.env.UPNSHARE_PRIMARY_KEY || '1a0befbb253f9fb583b8fc4f',
            headers: {
                'api-token': process.env.UPNSHARE_PRIMARY_KEY || '1a0befbb253f9fb583b8fc4f',
            },
        },
        fallback: {
            endpoint: process.env.UPNSHARE_FALLBACK_ENDPOINT || 'https://upnshare.com/api/v1/video/manage',
            apiKey: process.env.UPNSHARE_FALLBACK_KEY || 'ec56aeedf638b610bd769524',
            headers: {
                'api-token': process.env.UPNSHARE_FALLBACK_KEY || 'ec56aeedf638b610bd769524',
            },
        },
    },

    rpmshare: {
        enabled: true, // Enabled with user-provided API keys
        primary: {
            endpoint: process.env.RPMSHARE_PRIMARY_ENDPOINT || 'https://rpmshare.com/api/v1/video/manage',
            apiKey: process.env.RPMSHARE_PRIMARY_KEY || 'b71a58efa77a913bccc5ca93',
            headers: {
                'api-token': process.env.RPMSHARE_PRIMARY_KEY || 'b71a58efa77a913bccc5ca93',
            },
        },
        fallback: {
            endpoint: process.env.RPMSHARE_FALLBACK_ENDPOINT || 'https://rpmshare.com/api/v1/video/manage',
            apiKey: process.env.RPMSHARE_FALLBACK_KEY || '72f7dc17f129a2ca8ce52141',
            headers: {
                'api-token': process.env.RPMSHARE_FALLBACK_KEY || '72f7dc17f129a2ca8ce52141',
            },
        },
    },
};

/**
 * Timeout settings
 */
export const timeoutConfig = {
    primaryTimeout: 3000, // 3 seconds for primary API
    fallbackTimeout: 2000, // 2 seconds for fallback API
};
