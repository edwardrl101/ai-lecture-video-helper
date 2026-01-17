import { Caption } from "@/components/InitialScreen";

const BACKEND_URL = 'http://localhost:3000'

export interface Summary {
    id: string
    title: string
    timestamp: string
    summary: string
    details: string[]
}


const MOCK_SUMMARIES: Summary[] = [
    {
        id: '1',
        title: 'Introduction to React Architecture',
        timestamp: '02:45',
        summary: 'A deep dive into the virtual DOM and reconciliation process. Explains why React is efficient for UI rendering.',
        details: [
            'Understanding the Virtual DOM vs Real DOM',
            'The Diffing Algorithm explained',
            'How Fiber improves rendering performance',
            'Reconciliation lifecycle overview'
        ]
    },
    {
        id: '2',
        title: 'State Management Patterns',
        timestamp: '15:20',
        summary: 'Comparing local state, Context API, and external libraries like Redux or Zustand for global state.',
        details: [
            'When to use useState vs useReducer',
            'Avoiding prop drilling with Context',
            'Lifting state up best practices',
            'Performance considerations for large state'
        ]
    }
]

export async function generateSummary(captions: Caption[], streamUrl: string, duration: number, options: { signal: AbortSignal }): Promise<Summary[]> {
    console.log(`Calling backend API with ${captions.length} captions, streamUrl: ${streamUrl ? 'Present' : 'None'}, duration: ${duration}s`)

    // Map frontend 'caption' field to backend 'text' field
    const mappedCaptions = captions.map(c => ({
        text: c.caption,
        time: c.time
    }));

    const response = await fetch(`${BACKEND_URL}/generate-summary`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            captions: mappedCaptions,
            streamUrl: streamUrl,
            duration: duration
        }),
        signal: options.signal
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate summary');
    }

    return response.json();
}

export async function generateSummaryDummy(
    _: Caption[],
    options: { signal: AbortSignal }
): Promise<Summary[]> {
    const { signal } = options;

    const isSlow = Math.random() < 0.1;
    console.log('isSlow ', isSlow)
    const delay = isSlow ? 10000 : 1000;

    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            console.log('generated dummies')
            resolve(MOCK_SUMMARIES);
        }, delay);

        signal.addEventListener('abort', () => {
            console.log('failed')
            clearTimeout(timeoutId);
            reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
    });
}