// Test the /api/v1/video endpoint (not /manage!)
import axios from 'axios';

async function testVideoEndpoint() {
    try {
        const API_KEY = 'a56bbd94407e8de1550df9cf';
        const BASE_URL = 'https://streamp2p.com/api/v1/video';

        console.log('Testing: GET /api/v1/video\n');
        console.log('This endpoint might return player URLs!\n');

        const response = await axios.get(BASE_URL, {
            headers: { 'api-token': API_KEY }
        });

        console.log('========================================');
        console.log('SUCCESS! Response received:');
        console.log('========================================\n');

        console.log(JSON.stringify(response.data, null, 2));

        // Check if there's a player array
        if (response.data.player) {
            console.log('\n========================================');
            console.log('PLAYER ARRAY FOUND!');
            console.log('========================================\n');
            console.log('Player:', response.data.player);
        }

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testVideoEndpoint();
