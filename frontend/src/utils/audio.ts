/**
 * Requests the stream URL from the content script.
 */
export async function getStreamUrl(): Promise<StreamUrl | null> {
    return new Promise((resolve) => {
        // @ts-ignore - chrome API is available in extension context
        if (typeof chrome === 'undefined' || !chrome.tabs) {
            // Fallback for development/outside extension context if needed
            // For now, assume extension context or mock
            console.warn("Chrome API not found, returning null for stream URL");
            resolve(null);
            return;
        }

        // @ts-ignore
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]?.id) {
                resolve(null);
                return;
            }

            // @ts-ignore
            chrome.tabs.sendMessage(tabs[0].id, { action: "getStreamUrl" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Runtime error:", chrome.runtime.lastError);
                    resolve(null);
                } else if (response && response.success) {
                    resolve({ url: response.url, duration: response.duration });
                } else {
                    console.warn("Failed to get stream URL:", response?.error);
                    resolve(null);
                }
            });
        });
    });
}