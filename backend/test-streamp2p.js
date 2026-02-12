// Test extracting play and download fields from API
import axios from 'axios';

async function testPlayDownloadFields() {
    try {
        const API_KEY = 'a56bbd94407e8de1550df9cf';
        const BASE_URL = 'https://streamp2p.com/api/v1/video/manage';

        console.log('Step 1: Get all videos...\n');
        const listResponse = await axios.get(BASE_URL, {
            headers: { 'api-token': API_KEY }
        });

        const videos = listResponse.data.data || listResponse.data;
        console.log(`Found ${videos.length} videos\n`);

        // Find "It: Welcome to Derry S01E08"
        const target = videos.find(v =>
            (v.name || '').includes('Welcome to Derry') &&
            (v.name || '').includes('S01E08')
        );

        if (!target) {
            console.log('Video not found!');
            return;
        }

        console.log('✓ Found:', target.name);
        console.log('✓ ID:', target.id);
        console.log('\n');

        console.log('Step 2: Get full video details...\n');
        const detailsResponse = await axios.get(`${BASE_URL}/${target.id}`, {
            headers: { 'api-token': API_KEY }
        });

        const fullVideo = detailsResponse.data;

        console.log('========================================');
        console.log('FULL VIDEO OBJECT - ALL FIELDS');
        console.log('========================================\n');

        Object.keys(fullVideo).forEach(key => {
            const value = fullVideo[key];
            if (typeof value === 'string' && value.length > 100) {
                console.log(`${key}: ${value.substring(0, 100)}...`);
            } else if (typeof value === 'object') {
                console.log(`${key}: [object]`);
            } else {
                console.log(`${key}: ${value}`);
            }
        });

        console.log('\n========================================');
        console.log('KEY FIELDS FOR VIDEO PLAYBACK');
        console.log('========================================\n');

        console.log('PLAY field:', fullVideo.play || 'NOT FOUND');
        console.log('DOWNLOAD field:', fullVideo.download || 'NOT FOUND');
        console.log('PREMIUM DOWNLOAD field:', fullVideo.premiumDownload || 'NOT FOUND');

        console.log('\n========================================');
        console.log('FINAL RESULT');
        console.log('========================================\n');

        if (fullVideo.play) {
            console.log('✅ VIDEO PLAY URL FOUND!');
            console.log('Embed URL:', fullVideo.play);
        } else {
            console.log('❌ No play field found');
        }

        if (fullVideo.download || fullVideo.premiumDownload) {
            console.log('✅ DOWNLOAD URL FOUND!');
            console.log('Download URL:', fullVideo.download || fullVideo.premiumDownload);
        } else {
            console.log('❌ No download field found');
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
    }
}

testPlayDownloadFields();
