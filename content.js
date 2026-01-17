async function getLanguage() {
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
        console.log(data.Delivery.AvailableLanguages)
        return data.Delivery.AvailableLanguages

    } catch (error) {
        console.error('Error fetching DeliveryInfo:', error);
    }
}

async function getDeliveryInfo() {
    try {
        const languages = await getLanguage();

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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractCaptions") {
        (async () => {
            try {
                const data = await getDeliveryInfo();
                sendResponse({ success: true, data: data });

            } catch (error) {
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }
});

//