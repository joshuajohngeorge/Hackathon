"use client";

import { useState, useRef } from "react";
import { Upload, AlertTriangle, AlertCircle, Info, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Flag = {
  clause: string;
  text: string;
  severity: "high" | "medium" | "low";
  explanation: string;
};

type Analysis = {
  id: string;
  filename: string;
  summary: string;
  flags: Flag[];
};

type ChatMessage = { role: "user" | "assistant"; content: string };

const severityIcon = {
  high: <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />,
  medium: <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />,
  low: <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />,
};

const severityBorder = {
  high: "border-red-200 bg-red-50",
  medium: "border-yellow-200 bg-yellow-50",
  low: "border-blue-200 bg-blue-50",
};

export function LeaseAnalyzer() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }
    setError(null);
    setLoading(true);
    setAnalysis(null);
    setMessages([]);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/analyze-lease", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAnalysis(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !analysis) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch("/api/dispute-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: analysis.id, message: userMsg }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chat failed");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${(e as Error).message}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload area */}
      {!analysis && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => fileRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-16 text-center transition-colors ${
            dragging ? "border-green-400 bg-green-50" : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/40"
          }`}
        >
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
              <p className="text-gray-600 font-medium">Analyzing your lease&hellip;</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
                <Upload className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Drop your lease PDF here</p>
                <p className="text-sm text-gray-500 mt-1">or click to browse</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Results */}
      {analysis && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Analyzed</p>
              <p className="font-semibold text-gray-900">{analysis.filename}</p>
            </div>
            <button
              onClick={() => { setAnalysis(null); setMessages([]); setError(null); }}
              className="text-sm text-gray-500 hover:text-gray-900 underline"
            >
              Upload new lease
            </button>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Summary</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Flags */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">
              {analysis.flags.length === 0 ? "No issues found" : `${analysis.flags.length} issue${analysis.flags.length !== 1 ? "s" : ""} flagged`}
            </h2>
            <div className="space-y-3">
              {analysis.flags.map((flag, i) => (
                <div key={i} className={`rounded-xl border p-4 ${severityBorder[flag.severity]}`}>
                  <div className="flex items-start gap-2">
                    {severityIcon[flag.severity]}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{flag.clause}</p>
                      <p className="text-xs text-gray-500 mt-0.5 italic">&ldquo;{flag.text}&rdquo;</p>
                      <p className="text-sm text-gray-700 mt-1">{flag.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Ask about your lease</h2>
              <p className="text-xs text-gray-500 mt-0.5">Get help understanding clauses or drafting a dispute letter</p>
            </div>

            {messages.length > 0 && (
              <div className="px-6 py-4 space-y-4 max-h-80 overflow-y-auto">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-green-600 text-white rounded-br-sm"
                        : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    }`}>
                      {m.role === "assistant" ? (
                        <ReactMarkdown
                          components={{
                            h3: ({ children }) => <p className="font-semibold mt-2 mb-1">{children}</p>,
                            h2: ({ children }) => <p className="font-bold mt-2 mb-1">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>,
                            li: ({ children }) => <li>{children}</li>,
                            p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                            hr: () => <hr className="my-2 border-gray-300" />,
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-2">
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="e.g. Can my landlord charge this fee?"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || chatLoading}
                className="rounded-xl bg-green-600 text-white px-4 py-2 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
