// Test multiple possible endpoints
import axios from 'axios';

async function testAllEndpoints() {
    const API_KEY = 'a56bbd94407e8de1550df9cf';
    const videoId = 'pnzftr';
    const BASE = 'https://streamp2p.com';

    const endpoints = [
        `/api/v1/video/player/${videoId}`,
        `/api/v1/player/${videoId}`,
        `/api/v1/video/${videoId}/player`,
        `/api/v1/video/player/default`,
        `/api/v1/player/default`,
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`\nTrying: ${BASE}${endpoint}`);
            const response = await axios.get(`${BASE}${endpoint}`, {
                headers: { 'api-token': API_KEY },
                timeout: 5000
            });

            console.log('✅ SUCCESS!');
            console.log('Response:', JSON.stringify(response.data, null, 2));

        } catch (error) {
            console.log(`❌ Failed: ${error.response?.status || error.message}`);
        }
    }
}

testAllEndpoints();
