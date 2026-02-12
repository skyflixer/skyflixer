// Complete end-to-end test of StreamP2P integration
import axios from 'axios';

async function testCompleteFlow() {
    try {
        console.log('========================================');
        console.log('STREAMP2P INTEGRATION - END TO END TEST');
        console.log('========================================\n');

        // Test data for "It: Welcome to Derry S01E08"
        const testData = {
            title: 'It: Welcome to Derry',
            year: 2025,
            type: 'series',
            season: 1,
            episode: 8
        };

        console.log('📋 Test Data:');
        console.log(`  Title: ${testData.title}`);
        console.log(`  Season: ${testData.season}, Episode: ${testData.episode}`);
        console.log(`  Year: ${testData.year}`);
        console.log('');

        console.log('📡 Calling backend API...');
        const response = await axios.post('http://localhost:5000/api/videohosting/fetch', testData);

        console.log('✅ Backend Response Received!\n');
        console.log('========================================');
        console.log('RESPONSE DATA');
        console.log('========================================\n');

        const data = response.data;

        console.log('Available Servers:', data.availableCount);
        console.log('');

        // Check StreamP2P
        if (data.servers.streamp2p) {
            const streamp2p = data.servers.streamp2p;
            console.log('🎬 STREAMP2P:');
            console.log(`  Available: ${streamp2p.available ? '✅ YES' : '❌ NO'}`);

            if (streamp2p.available) {
                console.log(`  Video ID: ${streamp2p.videoData.id}`);
                console.log(`  Filename: ${streamp2p.videoData.name}`);
                console.log(`  Embed URL: ${streamp2p.embedUrl}`);
                console.log(`  Download URL: ${streamp2p.downloadUrl}`);
                console.log(`  Source: ${streamp2p.source}`);
            } else {
                console.log(`  Error: ${streamp2p.error || 'N/A'}`);
            }
            console.log('');
        }

        // Check other servers
        ['seekstreaming', 'upnshare', 'rpmshare'].forEach(server => {
            if (data.servers[server]) {
                console.log(`📺 ${server.toUpperCase()}:`);
                console.log(`  Available: ${data.servers[server].available ? '✅ YES' : '❌ NO'}`);
                if (!data.servers[server].available) {
                    console.log(`  Reason: ${data.servers[server].error}`);
                }
                console.log('');
            }
        });

        console.log('========================================');
        console.log('FINAL RESULT');
        console.log('========================================\n');

        if (data.availableCount > 0) {
            console.log('✅ SUCCESS! Video hosting is working!');
            console.log(`   ${data.availableCount} server(s) available`);
            console.log('\n🎉 Multi-server selector should show in the video player!');
        } else {
            console.log('⚠️  No servers available - will use Videasy.net fallback');
        }

    } catch (error) {
        console.error('❌ Test Failed!');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testCompleteFlow();
