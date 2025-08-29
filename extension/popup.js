document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startRecording');
  const stopBtn = document.getElementById('stopRecording');
  const statusDiv = document.getElementById('status');
  const transcriptDiv = document.getElementById('transcript');
  const summaryDiv = document.getElementById('summary');

  function sendMessage(action) {
    statusDiv.textContent = `Attempting ${action}...`;
    chrome.runtime.sendMessage({ action }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Runtime error:", chrome.runtime.lastError.message);
        statusDiv.textContent = `Error: ${chrome.runtime.lastError.message}`;
        return;
      }
      console.log("Response from content:", response);
      statusDiv.textContent = response?.status || "No response";
    });
  }

  startBtn.addEventListener('click', () => sendMessage("startRecording"));
  stopBtn.addEventListener('click', () => sendMessage("stopRecording"));

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "results") {
      transcriptDiv.textContent = message.transcript || "No transcript";
      summaryDiv.textContent = message.summary || "No summary";
      statusDiv.textContent = "Done!";
    }
  });
});