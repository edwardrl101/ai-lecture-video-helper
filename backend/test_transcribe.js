
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
                duration: 197,
                url: 'https://s-cloudfront.cdn.ap.panopto.com/sessions/f63f91ea-3b04-4cae-b52b-af7b009f3630/ec43ba04-14ed-4d5e-b6e4-af7b009f3640-3b1d828a-c1ec-4e90-9587-af7b00a33dab.hls/master.m3u8?InvocationID=1f6fb552-85f3-f011-aa0c-064de5ffa912&tid=00000000-0000-0000-0000-000000000000&StreamID=4ce36031-d21f-484b-8952-af7b009f36d5&ServerName=mediaweb.ap.panopto.com'
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
