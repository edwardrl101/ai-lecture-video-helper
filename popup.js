document.getElementById("getCaptions").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id, allFrames: true },
            files: ["content.js"]
        },
        () => {
            chrome.tabs.sendMessage(tab.id, { action: "extractCaptions" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Message failed:", chrome.runtime.lastError.message);
                } else {
                    console.log("Captions:", response?.captions);
                }
            });
        }
    );
});