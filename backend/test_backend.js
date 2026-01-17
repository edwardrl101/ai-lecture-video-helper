
async function testBackend() {
    try {
        console.log('Testing backend...');
        const response = await fetch('http://localhost:3000/generate-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                captions: [
                    { text: "Hello world", start: 0, end: 1 },
                    { text: "This is a test lecture", start: 1, end: 5 }
                ]
            })
        });

        console.log('Response status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('Response data:', JSON.stringify(data, null, 2));
        } else {
            console.log('Error text:', await response.text());
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testBackend();
