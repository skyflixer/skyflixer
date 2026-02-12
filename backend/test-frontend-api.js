// Test frontend API calls from browser perspective
import axios from 'axios';

async function testFrontendAPICalls() {
    const BACKEND_URL = 'http://localhost:5000';

    console.log('========================================');
    console.log('TESTING FRONTEND API CALLS');
    console.log('========================================\n');

    try {
        // Test 1: Trending movies/TV
        console.log('1. Testing /api/tmdb/trending/all/day');
        const trending = await axios.get(`${BACKEND_URL}/api/tmdb/trending/all/day`);
        console.log(`✅ Trending: ${trending.data.results.length} items`);
        console.log(`   First item: ${trending.data.results[0].title || trending.data.results[0].name}`);
        console.log('');

        // Test 2: Popular movies
        console.log('2. Testing /api/tmdb/movie/popular');
        const movies = await axios.get(`${BACKEND_URL}/api/tmdb/movie/popular`);
        console.log(`✅ Popular Movies: ${movies.data.results.length} items`);
        console.log(`   First movie: ${movies.data.results[0].title}`);
        console.log('');

        // Test 3: Popular TV shows
        console.log('3. Testing /api/tmdb/tv/popular');
        const tv = await axios.get(`${BACKEND_URL}/api/tmdb/tv/popular`);
        console.log(`✅ Popular TV: ${tv.data.results.length} items`);
        console.log(`   First show: ${tv.data.results[0].name}`);
        console.log('');

        console.log('========================================');
        console.log('✅ ALL API CALLS SUCCESSFUL!');
        console.log('========================================');
        console.log('\nThe TMDB API is working perfectly.');
        console.log('If posts are not showing, the issue is likely in the frontend React components.');

    } catch (error) {
        console.error('❌ API Test Failed!');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testFrontendAPICalls();
