async function getDeliveryData() {
    try {
        const url = 'https://mediaweb.ap.panopto.com/Panopto/Pages/Viewer/DeliveryInfo.aspx';
        const urlParams = new URLSearchParams(window.location.search);
        const deliveryId = urlParams.get('id');
        const params = new URLSearchParams({
            deliveryId: deliveryId,
            responseType: 'json'
        });


        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
            credentials: 'include'
        });


        const data = await response.json();
        console.log(data.Delivery)
        return data.Delivery

    } catch (error) {
        console.error('Error fetching DeliveryInfo:', error);
    }
}

async function getCaptionsInfo() {
    try {
        const deliveryData = await getDeliveryData();
        const languages = deliveryData.AvailableLanguages;

        const url = 'https://mediaweb.ap.panopto.com/Panopto/Pages/Viewer/DeliveryInfo.aspx';
        const urlParams = new URLSearchParams(window.location.search);
        const deliveryId = urlParams.get('id');
        const params = new URLSearchParams({
            deliveryId: deliveryId,
            getCaptions: 'true',
            language: languages[0],
            responseType: 'json'
        });


        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
            credentials: 'include'
        });

        const data = await response.json();
        return data

    } catch (error) {
        console.error('Error fetching DeliveryInfo:', error);
    }
}

async function getStreamUrl() {
    console.log("[PanoptoHelper] Searching for media...");
    const deliveryData = await getDeliveryData();
    try {
        const streamUrl = deliveryData?.Streams[0].StreamUrl;
        console.log(streamUrl)
        return { url: streamUrl, duration: deliveryData.Duration };
    } catch (error) {
        console.error('Error fetching Stream URL:', error);
        throw error;
    }
}

// Unified Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Return true indicates we will respond asynchronously
    const handleRequest = async () => {
        try {
            switch (request.action) {
                case "extractCaptions":
                    const captionsData = await getCaptionsInfo();
                    sendResponse({ success: true, data: captionsData });
                    break;

                case "getStreamUrl":
                    const streamUrl = await getStreamUrl();
                    if (streamUrl) {
                        sendResponse({ success: true, url: streamUrl.url, duration: streamUrl.duration });
                    } else {
                        sendResponse({ success: false, error: "Could not find stream URL" });
                    }
                    break;

                default:
                    sendResponse({ success: false, error: "Unknown action" });
            }
        } catch (error) {
            console.error(`Error handling ${request.action}:`, error);
            sendResponse({ success: false, error: error.message });
        }
    };

    handleRequest();
    return true; // Keep the message channel open for async response
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "SEEK_VIDEO") {
        const video = document.querySelector('video');

        if (video) {
            // Move the video to the specific second
            video.currentTime = request.time;

            // Optional: Auto-play if it was paused
            video.play();

            console.log(`[PanoptoHelper] Seeking to ${request.time}s`);
            sendResponse({ status: "success" });
        } else {
            console.error("[PanoptoHelper] No video element found to seek.");
            sendResponse({ status: "error", message: "Video not found" });
        }
    }
});

//