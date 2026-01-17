import { Caption } from "../components/InitialScreen";

// 1. Change to an async function so we can use 'await'
export async function getCaptions(): Promise<Caption[]> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      console.error("No active tab found");
      return [];
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });

    // 2. Wrap the message in a Promise to "wait" for the response
    const response = await new Promise<any>((resolve) => {
      chrome.tabs.sendMessage(tab.id!, { action: "extractCaptions" }, (res) => {
        if (chrome.runtime.lastError) {
          console.error("Message failed:", chrome.runtime.lastError.message);
          resolve(null);
        } else {
          resolve(res);
        }
      });
    });

    if (!response) return [];

    // 3. Process the data and return it
    const rawData = response?.data ?? response?.captions ?? response;
    return getCaptionsResponse(rawData);

  } catch (err) {
    console.error("Error in getCaptions():", err);
    return [];
  }
}

function getCaptionsResponse(data: any): Caption[] {
  const events = data?.Events || data;
  if (!Array.isArray(events)) return [];

  return events.map((item: any) => ({
    time: item.Time ?? 0,
    caption: item.Caption ?? ""
  }));
}