export interface TranscriptionSegment {
    start: number;
    end: number;
    text: string;
}

const BACKEND_URL = 'http://3.27.193.101';

export async function transcribeVideo(url: string, duration: number, options?: { signal?: AbortSignal }): Promise<TranscriptionSegment[]> {
    console.log(`📡 Calling transcription API for: ${url} (${duration}s)`);

    const response = await fetch(`${BACKEND_URL}/api/transcribe`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, duration }),
        signal: options?.signal
    });


    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Transcription failed with status ${response.status}`);
    }

    return response.json();
}
