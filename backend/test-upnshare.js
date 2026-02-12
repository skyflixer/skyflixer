import axios from 'axios';
import fs from 'fs';

async function testUpnshare() {
    try {
        console.log('Testing Upnshare integration...');

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
        console.log('Fetch Result Keys:', Object.keys(result.servers));

        if (result.servers.upnshare) {
            console.log('Upnshare Result:', JSON.stringify(result.servers.upnshare, null, 2));

            const embedUrl = result.servers.upnshare.embedUrl;
            console.log('Embed URL:', embedUrl);

            if (embedUrl && embedUrl.includes('skyflixer.upn.one')) {
                console.log('SUCCESS: Upnshare URL format is correct');
            } else {
                console.log('FAILURE: Upnshare URL format is incorrect');
            }
        } else {
            console.log('FAILURE: Upnshare not found in response');
        }

        // Write full result to file for inspection
        fs.writeFileSync('upnshare-test-result.json', JSON.stringify(result, null, 2));
        console.log('Full result written to upnshare-test-result.json');

    } catch (error) {
        console.error('Error testing Upnshare:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received');
        }
    }
}

testUpnshare();
