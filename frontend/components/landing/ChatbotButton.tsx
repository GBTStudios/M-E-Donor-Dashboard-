"use client";

import { useState } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { sendChatMessage } from "@/lib/chat";

/**
 * Floating chatbot trigger, fixed to the bottom-right corner across the
 * whole landing page. Wired to POST /chat/message (public, no auth).
 *
 * Not yet grounded in Knowledge Base documents — RAG retrieval exists as
 * a backend service but isn't wired into the live agent yet, per the
 * contract. Greeting copy below is worded to avoid implying the bot
 * answers from "our data" until that's actually true.
 */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SESSION_STORAGE_KEY = "chat_session_id";

export default function ChatbotButton() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm the Groundbreaker assistant. Ask me anything and I'll do my best to help.",
    },
  ]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;

    setError("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    const sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const result = await sendChatMessage(text, sessionId);

    setSending(false);

    if (result.success && result.response) {
      if (result.sessionId) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, result.sessionId);
      }
      setMessages((prev) => [...prev, { role: "assistant", content: result.response! }]);
      return;
    }

    setError(result.error ?? "Something went wrong. Please try again.");
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

            {sending && (
              <div className="bg-[#eaf5f0] text-gray-500 text-sm max-w-[85%] px-3.5 py-2.5 rounded-lg flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Thinking...
              </div>
            )}

            {error && (
              <p role="alert" className="text-xs text-red-600 text-center">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-black/10 p-3 flex-shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={sending}
              placeholder="Ask a question..."
              className="flex-1 text-sm px-3.5 py-2.5 rounded-lg border border-black/10 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A534A]/40 disabled:opacity-60"
            />
            <button
              onClick={sendMessage}
              disabled={sending}
              aria-label="Send message"
              className="w-10 h-10 flex-shrink-0 rounded-lg bg-[#1A534A] hover:bg-[#134038] flex items-center justify-center transition disabled:opacity-60"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
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
