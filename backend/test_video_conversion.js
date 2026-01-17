
import fetch from 'node-fetch';

async function testTranscribe() {
    try {
        console.log("Testing transcription with CS1231 Video...");
        const response = await fetch('http://localhost:3000/api/transcribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                duration: 2800,
                url: 'https://s-cloudfront.cdn.ap.panopto.com/sessions/5db87e37-08aa-4e21-801b-b0f900142137/5b8c4d1f-2920-497c-9bb1-b0f900142141-095abb3c-d486-40a7-8179-b101003fa28c.hls/master.m3u8?InvocationID=61f32820-aaf3-f011-aa0c-064de5ffa912&tid=00000000-0000-0000-0000-000000000000&StreamID=ef9ef30f-671e-45ab-92b5-b10100107abc&ServerName=mediaweb.ap.panopto.com'
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
