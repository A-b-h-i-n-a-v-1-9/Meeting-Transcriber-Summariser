chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startRecording" || message.action === "stopRecording") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ["content.js"]
        }, () => {
          chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Send message error:", chrome.runtime.lastError.message);
              sendResponse({ status: "Error", error: chrome.runtime.lastError.message });
            } else {
              sendResponse(response);
            }
          });
        });
      } else {
        sendResponse({ status: "Error", error: "No active tab" });
      }
    });
    return true;
  } else if (message.action === "results") {
    chrome.runtime.sendMessage(message);
  }
});