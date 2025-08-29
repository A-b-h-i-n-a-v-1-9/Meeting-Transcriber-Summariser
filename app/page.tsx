"use client";
import { useState } from "react";
import { Upload, Mic, Sparkles, FileAudio, Download, Trash2, Clock, User, BarChart3 } from "lucide-react";

export default function Home() {
  const [status, setStatus] = useState("");
  const [lastFile, setLastFile] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const fd = new FormData();
    fd.append("file", f);

    setStatus("Uploading...");
    setIsProcessing(true);
    
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setLastFile(json.fileName);
      setStatus("Uploaded: " + json.fileName);
      setIsProcessing(false);
    } catch (err: any) {
      setStatus("Upload failed: " + err.message);
      setIsProcessing(false);
    }
  };

  const handleTranscribe = async () => {
    if (!lastFile) return;
    setStatus("Transcribing...");
    setIsProcessing(true);
    
    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: JSON.stringify({ fileName: lastFile }),
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setTranscript(json.transcript || "No transcript");
      setStatus("Done ✅");
      setIsProcessing(false);
    } catch (err: any) {
      setTranscript("");
      setStatus("Transcription failed: " + err.message);
      setIsProcessing(false);
    }
  };

  const handleSummarize = async () => {
    if (!transcript) return;
    setStatus("Summarizing...");
    setIsProcessing(true);
    
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        body: JSON.stringify({ transcript }),
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setSummary(json.summary || "No summary");
      setStatus("Summary Ready ✨");
      setIsProcessing(false);
    } catch (err: any) {
      setSummary("");
      setStatus("Summarization failed: " + err.message);
      setIsProcessing(false);
    }
  };

  const handleClearAll = () => {
    setLastFile(null);
    setTranscript("");
    setSummary("");
    setStatus("");
  };

  const handleDownload = (content: string, filename: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-white rounded-2xl shadow-lg">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <BarChart3 className="text-indigo-600" />
              Meeting Intelligence Dashboard
            </h1>
            <p className="text-gray-500 mt-1">Transform your meetings into actionable insights</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Upload Meeting</h2>
                <p className="text-gray-500 text-sm">Upload audio or video files from your meetings</p>
              </div>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-indigo-100 rounded-full">
                      <Upload className="w-6 h-6 text-indigo-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">Drag & drop files or</p>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 hover:bg-gray-300 transition font-medium shadow-sm inline-flex items-center space-x-2">
                      Browse files
                    </span>
                    <input
                      id="file-upload"
                      type="file"
                      accept="audio/*,video/*"
                      onChange={handleUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {lastFile && (
                  <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileAudio className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium truncate max-w-[160px]">{lastFile}</span>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Uploaded
                    </span>
                  </div>
                )}
              </div>
              {isProcessing && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Processing...</span>
                      <span>Working</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300 animate-pulse" style={{ width: `50%` }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Meeting Info Card */}
            {lastFile && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Meeting Information</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium">32:15</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Participants</p>
                      <p className="font-medium">4</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={handleTranscribe} 
                    className="w-full justify-center px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition font-medium shadow-md flex items-center space-x-2"
                    disabled={isProcessing}
                  >
                    <Mic className="w-4 h-4" />
                    <span>Transcribe Meeting</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transcript Card */}
            {transcript && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-row items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Meeting Transcript</h2>
                    <p className="text-gray-500 text-sm">Full text transcription of your meeting</p>
                  </div>
                  <button 
                    onClick={() => handleDownload(transcript, "transcript.txt")}
                    className="px-3 py-1 rounded-lg bg-transparent text-gray-600 hover:bg-gray-100 shadow-none flex items-center space-x-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
                <div>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                    <p className="whitespace-pre-line text-gray-700 text-sm">{transcript}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button 
                    onClick={handleSummarize} 
                    className="w-full justify-center px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition font-medium shadow-md flex items-center space-x-2"
                    disabled={isProcessing}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Summary & Insights</span>
                  </button>
                </div>
              </div>
            )}

            {/* Summary Card */}
            {summary && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-row items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Meeting Summary</h2>
                    <p className="text-gray-500 text-sm">Key points from the discussion</p>
                  </div>
                  <button 
                    onClick={() => handleDownload(summary, "summary.txt")}
                    className="px-3 py-1 rounded-lg bg-transparent text-gray-600 hover:bg-gray-100 shadow-none flex items-center space-x-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                  </button>
                </div>
                <div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-gray-800">{summary}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Bar */}
        {status && (
          <div className="fixed bottom-4 right-4 p-4 bg-gray-800 text-white rounded-lg shadow-lg flex items-center space-x-2">
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : status.includes("Ready") || status.includes("Done") ? (
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            ) : (
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            )}
            <span className="text-sm">{status}</span>
          </div>
        )}
      </div>

      <style jsx global>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
      `}</style>
    </main>
  );
}