"use client";
import { useState } from "react";
import { Upload, Mic, Sparkles, FileAudio } from "lucide-react";

// --- Simple Tailwind Components ---
function Button({ children, className = "", ...props }: any) {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition font-medium shadow-md ${className}`}
    >
      {children}
    </button>
  );
}

function Card({ children }: any) {
  return <div className="bg-white rounded-2xl shadow-lg p-6">{children}</div>;
}
function CardHeader({ children }: any) {
  return <div className="mb-4">{children}</div>;
}
function CardTitle({ children }: any) {
  return <h2 className="text-xl font-semibold text-gray-800">{children}</h2>;
}
function CardContent({ children }: any) {
  return <div>{children}</div>;
}
// -----------------------------------

export default function Home() {
  const [status, setStatus] = useState("");
  const [lastFile, setLastFile] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [insights, setInsights] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const fd = new FormData();
    fd.append("file", f);

    setStatus("Uploading...");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setLastFile(json.fileName);
      setStatus("Uploaded: " + json.fileName);
    } catch (err: any) {
      setStatus("Upload failed: " + err.message);
    }
  };

  const handleTranscribe = async () => {
    if (!lastFile) return;
    setStatus("Transcribing...");
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
    } catch (err: any) {
      setTranscript("");
      setStatus("Transcription failed: " + err.message);
    }
  };

  const handleSummarize = async () => {
    if (!transcript) return;
    setStatus("Summarizing...");
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        body: JSON.stringify({ transcript }),
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setSummary(json.summary || "No summary");
      setInsights(json.insights || []);
      setActionItems(json.action_items || []);
      setStatus("Summary Ready ✨");
    } catch (err: any) {
      setSummary("");
      setInsights([]);
      setActionItems([]);
      setStatus("Summarization failed: " + err.message);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">🎙️ Meeting AI Dashboard</h1>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Audio/Video</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <input
              type="file"
              accept="audio/*,video/*"
              onChange={handleUpload}
              className="mb-4 sm:mb-0"
            />
            {lastFile && (
              <Button onClick={handleTranscribe} className="flex items-center space-x-2">
                <Mic className="w-4 h-4" />
                <span>Transcribe Last Upload</span>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Transcript Card */}
        {transcript && (
          <Card>
            <CardHeader>
              <CardTitle>📝 Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-gray-700">{transcript}</p>
              <Button
                onClick={handleSummarize}
                className="mt-4 flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Summarize Transcript</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary Card */}
        {(summary || insights.length > 0 || actionItems.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>✨ Summary & Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {summary && <p className="text-gray-800">{summary}</p>}

              {insights.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">💡 Insights</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {insights.map((i, idx) => (
                      <li key={idx}>{i}</li>
                    ))}
                  </ul>
                </div>
              )}

              {actionItems.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">✅ Action Items</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {actionItems.map((a, idx) => (
                      <li key={idx}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Status */}
        {status && (
          <div className="p-4 bg-gray-800 text-white rounded-lg shadow">
            {status}
          </div>
        )}
      </div>
    </main>
  );
}
