/**
 * Sends a message to the content script to seek the video to a specific time.
 */
export const seekVideo = (seconds: number) => {
    console.log(`🎬 Seeking video to ${seconds}s`);
    // @ts-ignore
    if (typeof chrome !== 'undefined' && chrome.tabs) {
        // @ts-ignore
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                // @ts-ignore
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "SEEK_VIDEO",
                    time: seconds
                });
            }
        });
    }
};

/**
 * Parses "MM:SS" or "HH:MM:SS" into total seconds.
 */
export const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(':').map(Number);
    if (parts.length === 3) {
        // HH:MM:SS
        const [hours, mins, secs] = parts;
        return (hours * 3600) + (mins * 60) + (secs || 0);
    } else if (parts.length === 2) {
        // MM:SS
        const [mins, secs] = parts;
        return (mins * 60) + (secs || 0);
    }
    return 0;
};
/**
 * Formats seconds into "MM:SS" format.
 */
export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
