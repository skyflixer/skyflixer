import axios from 'axios';
import fs from 'fs';

async function testRpmshare() {
    try {
        console.log('Testing Rpmshare integration...');

        // Check API Status first
        const statusResponse = await axios.get('http://localhost:5000/api/videohosting/status');
        console.log('API Status:', JSON.stringify(statusResponse.data, null, 2));

        // Test Fetch for a movie
        const payload = {
            title: "Deadpool & Wolverine",
            type: "movie",
            year: 2024
        };

        console.log('Fetching video with payload:', payload);
        const fetchResponse = await axios.post('http://localhost:5000/api/videohosting/fetch', payload);

        const result = fetchResponse.data;
        if (result.servers.rpmshare) {
            console.log('Rpmshare Result:', JSON.stringify(result.servers.rpmshare, null, 2));

            const embedUrl = result.servers.rpmshare.embedUrl;
            console.log('Embed URL:', embedUrl);

            if (embedUrl && embedUrl.includes('skyflixer.rpmplay.me')) {
                console.log('SUCCESS: Rpmshare URL format is correct');
            } else {
                console.log('FAILURE: Rpmshare URL format is incorrect');
            }
        } else {
            console.log('FAILURE: Rpmshare not found in response');
        }

        // Write full result to file for inspection
        fs.writeFileSync('rpmshare-test-result.json', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error testing Rpmshare:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testRpmshare();
