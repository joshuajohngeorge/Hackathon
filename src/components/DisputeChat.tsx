"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant"; content: string };

const OPENING_MESSAGE =
  "Hi, I'm Leroy, your lease dispute assistant. I know Illinois tenant law and Champaign-Urbana housing inside out. Tell me what's going on with your lease or landlord and I'll help you figure out your options and exactly what to say.";

export function DisputeChat({
  analysisId,
  initialHistory,
}: {
  analysisId?: string;
  initialHistory: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/dispute-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, analysisId }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply ?? data.error ?? "Something went wrong." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Analysis banner */}
      {analysisId && (
        <div className="shrink-0 bg-green-50 border-b border-green-100 px-6 py-3 text-sm text-green-800">
          <span className="font-medium">Your lease analysis is loaded.</span> I can see your flagged terms and benchmark comparisons. Just tell me which issue you want to tackle.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Static opening message */}
        <AssistantBubble content={OPENING_MESSAGE} />

        {messages.map((m, i) =>
          m.role === "assistant" ? (
            <AssistantBubble key={i} content={m.content} />
          ) : (
            <UserBubble key={i} content={m.content} />
          )
        )}

        {loading && (
          <div className="flex gap-3">
            <Avatar />
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3 items-end">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={onKeyDown}
            placeholder="Describe your situation or ask anything about your lease..."
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 leading-relaxed overflow-hidden"
            style={{ height: "44px" }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="shrink-0 w-11 h-11 rounded-xl bg-green-600 text-white flex items-center justify-center hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          Not a lawyer. For serious legal issues contact{" "}
          <a href="https://illinoislegalaid.org" target="_blank" rel="noopener noreferrer" className="underline">
            Land of Lincoln Legal Aid
          </a>{" "}
          or the{" "}
          <a href="https://tenant.illinois.edu" target="_blank" rel="noopener noreferrer" className="underline">
            UIUC Tenant Union
          </a>.
        </p>
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div className="shrink-0 w-8 h-8 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mt-0.5" title="Leroy">
      <img src="/beaver.png" alt="Leroy" className="w-9 h-9 object-contain" />
    </div>
  );
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-3 max-w-3xl mx-auto w-full">
      <Avatar />
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 leading-relaxed prose-sm max-w-none flex-1">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <p className="font-bold text-base mb-1">{children}</p>,
            h2: ({ children }) => <p className="font-bold mb-1">{children}</p>,
            h3: ({ children }) => <p className="font-semibold mb-1">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>,
            li: ({ children }) => <li className="leading-snug">{children}</li>,
            p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
            hr: () => <hr className="my-3 border-gray-200" />,
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-green-700 underline">
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-green-300 pl-3 italic text-gray-600 my-2">{children}</blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end max-w-3xl mx-auto w-full">
      <div className="bg-green-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm max-w-[75%] leading-relaxed">
        {content}
      </div>
    </div>
  );
}
