
import fetch from 'node-fetch';

async function testTranscribe() {
    try {
        console.log("Testing transcription with GESS1025 Video...");
        const response = await fetch('http://localhost:3000/api/transcribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                duration: 6500,
                url: 'https://s-cloudfront.cdn.ap.panopto.com/sessions/c2405e48-0c2e-469e-a67f-b3ca00db4a0e/e14faa86-2c3f-4dff-953a-b3ca00db4a18-b5830cf8-3068-4665-89c2-b3d0006027d9.hls/master.m3u8?InvocationID=15f61624-b4f3-f011-aa0c-064de5ffa912&tid=00000000-0000-0000-0000-000000000000&StreamID=afff29cf-53d4-4f9c-b35f-b3d00041eb0f&ServerName=mediaweb.ap.panopto.com'
            }),
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

testTranscribe();
