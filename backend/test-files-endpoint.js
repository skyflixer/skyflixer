// Test /api/v1/video/manage/{id}/files endpoint
import axios from 'axios';

async function testFilesEndpoint() {
    try {
        const API_KEY = 'a56bbd94407e8de1550df9cf';
        const videoId = 'pnzftr'; // It: Welcome to Derry S01E08
        const endpoint = `https://streamp2p.com/api/v1/video/manage/${videoId}/files`;

        console.log('========================================');
        console.log('Testing FILES endpoint!');
        console.log('========================================\n');
        console.log('Endpoint:', endpoint);
        console.log('Video ID:', videoId);
        console.log('');

        const response = await axios.get(endpoint, {
            headers: { 'api-token': API_KEY }
        });

        console.log('✅ SUCCESS! Response received:\n');
        console.log(JSON.stringify(response.data, null, 2));

        console.log('\n========================================');
        console.log('ANALYZING FILES');
        console.log('========================================\n');

        const files = Array.isArray(response.data) ? response.data : [response.data];

        files.forEach((file, index) => {
            console.log(`File ${index + 1}:`);
            console.log(`  Type: ${file.type}`);
            console.log(`  URL: ${file.url}`);
            console.log(`  ID: ${file.id}`);
            console.log('');
        });

        // Look for video player URL
        const playerFile = files.find(f => f.type === 'video' || f.type === 'player' || f.type === 'stream');
        const subtitleFile = files.find(f => f.type === 'subtitle');

        console.log('========================================');
        console.log('EXTRACTED URLs');
        console.log('========================================\n');

        if (playerFile) {
            console.log('✅ VIDEO/PLAYER URL FOUND!');
            console.log('URL:', playerFile.url);
        } else {
            console.log('❌ No video/player file found');
        }

        if (subtitleFile) {
            console.log('✅ SUBTITLE URL FOUND!');
            console.log('URL:', subtitleFile.url);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testFilesEndpoint();
