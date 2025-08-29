let mediaRecorder;
let audioChunks = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Content script received:", message.action);
  if (message.action === "startRecording") {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        console.log("Got stream, starting recorder");
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
          console.log("Data available, chunk size:", event.data.size);
          audioChunks.push(event.data);
        };
        mediaRecorder.onstop = () => {
          console.log("Recording stopped, processing audio, chunks:", audioChunks.length);
          if (audioChunks.length === 0) {
            console.warn("No audio data captured");
            sendResponse({ status: "Error", error: "No audio data" });
            stream.getTracks().forEach(track => track.stop());
            return;
          }
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('file', audioBlob, 'meeting_audio.webm');

          fetch('http://127.0.0.1:8000/upload', { method: 'POST', body: formData })
            .then(response => {
              console.log("Upload response status:", response.status);
              if (!response.ok) throw new Error(`Upload failed with ${response.status}`);
              return response.json();
            })
            .then(uploadJson => {
              console.log("Upload result:", uploadJson);
              const fileName = uploadJson.fileName;
              return fetch('http://127.0.0.1:8000/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName })
              });
            })
            .then(response => {
              console.log("Transcribe response status:", response.status);
              if (!response.ok) throw new Error(`Transcribe failed with ${response.status}`);
              return response.json();
            })
            .then(transcribeJson => {
              console.log("Transcribe result:", JSON.stringify(transcribeJson));
              const transcript = transcribeJson.transcript;
              return fetch('http://127.0.0.1:8000/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript })
              });
            })
            .then(response => {
              console.log("Summarize response status:", response.status);
              if (!response.ok) throw new Error(`Summarize failed with ${response.status}`);
              return response.json();
            })
            .then(summarizeJson => {
              console.log("Summarize result:", summarizeJson);
              const transcriptText = transcribeJson.transcript;
              if (transcriptText) {
                console.log("Preparing to download transcript:", transcriptText.substring(0, 50));
                const transcriptBlob = new Blob([transcriptText], { type: 'text/plain' });
                const url = URL.createObjectURL(transcriptBlob);
                chrome.downloads.download({
                  url: url,
                  filename: `meeting_transcript_${new Date().toISOString().slice(0, 10)}.txt`
                }, (downloadId) => {
                  if (chrome.runtime.lastError) {
                    console.error("Download error:", chrome.runtime.lastError.message);
                  } else {
                    console.log("Transcript download started, ID:", downloadId);
                  }
                  // Ensure results are sent regardless of download outcome
                  chrome.runtime.sendMessage({ action: "results", transcript: transcriptText, summary: summarizeJson.summary });
                  console.log("Results sent");
                });
              } else {
                console.warn("No transcript to download");
                chrome.runtime.sendMessage({ action: "results", transcript: "No transcript", summary: summarizeJson.summary });
                console.log("Results sent with no transcript");
              }
              stream.getTracks().forEach(track => track.stop());
            })
            .catch(err => console.error("Pipeline error:", err.message));
        };

        mediaRecorder.start(1000); // Record in 1-second chunks
        sendResponse({ status: "Recording started" });
      })
      .catch(err => {
        console.error("getUserMedia error:", err.message);
        sendResponse({ status: "Error", error: err.message });
      });
    return true;
  } else if (message.action === "stopRecording") {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      console.log("Recorder stopped manually");
      sendResponse({ status: "Recording stopped" });
    } else {
      sendResponse({ status: "No active recording" });
    }
  }
});