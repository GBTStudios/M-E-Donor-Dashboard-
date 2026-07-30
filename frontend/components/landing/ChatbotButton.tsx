"use client";

import { useState } from "react";
import { MessageSquare, X, Send } from "lucide-react";

/**
 * Floating chatbot trigger, fixed to the bottom-right corner across the
 * whole landing page. Reuses the existing chatbot backend (the same one
 * embedded in the Groundbreaker analytics dashboard) rather than a new
 * system — this file only handles the UI trigger/panel and message list.
 *
 * TODO once the backend confirms the shared chatbot endpoint's contract:
 * wire `sendMessage` below to actually POST to it and stream/display the
 * response, instead of the placeholder echo behavior.
 */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function ChatbotButton() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! Ask me anything about Groundbreaker Impact, our data, or how to get involved.",
    },
  ]);

  function sendMessage() {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");

    // Placeholder until the shared chatbot endpoint is wired in.
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Thanks for your question — this will connect to our live assistant soon.",
        },
      ]);
    }, 500);
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[26rem] max-w-[calc(100vw-3rem)] h-[34rem] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-xl border border-black/10 flex flex-col overflow-hidden">
          <div className="bg-[#1A534A] px-5 py-4 flex items-center justify-between flex-shrink-0">
            <p className="text-white text-sm font-medium">Groundbreaker Assistant</p>
            <button onClick={() => setOpen(false)} aria-label="Close chat">
              <X className="w-4 h-4 text-white/80 hover:text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm max-w-[85%] px-3.5 py-2.5 rounded-lg leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#1A534A] text-white ml-auto"
                    : "bg-[#eaf5f0] text-gray-800"
                }`}
              >
                {m.content}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-black/10 p-3 flex-shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask a question..."
              className="flex-1 text-sm px-3.5 py-2.5 rounded-lg border border-black/10 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A534A]/40"
            />
            <button
              onClick={sendMessage}
              aria-label="Send message"
              className="w-10 h-10 flex-shrink-0 rounded-lg bg-[#1A534A] hover:bg-[#134038] flex items-center justify-center transition"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chatbot" : "Open chatbot"}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#1A534A] hover:bg-[#134038] shadow-lg flex items-center justify-center transition"
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageSquare className="w-6 h-6 text-white" />
        )}
      </button>
    </>
  );
}