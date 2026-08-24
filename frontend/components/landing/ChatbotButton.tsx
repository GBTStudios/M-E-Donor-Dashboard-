"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, X, Send, Loader2, Copy, Check, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sendChatMessage } from "@/lib/chat";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const SESSION_STORAGE_KEY = "chat_session_id";

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatbotButton() {
  const { t } = useTranslation("donor");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // The greeting is language-dependent, so it can't be built once as a
  // static initial value (that would freeze it in whatever language was
  // active on first mount). Instead it's set here, and re-set whenever the
  // language changes while the conversation is still just the greeting —
  // matching how every other component in the app picks up i18n changes.
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 0 || (prev.length === 1 && prev[0].role === "assistant")) {
        return [{ role: "assistant", content: t("chatbot.greeting"), timestamp: Date.now() }];
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;

    setError("");
    setMessages((prev) => [...prev, { role: "user", content: text, timestamp: Date.now() }]);
    setInput("");
    setSending(true);

    const sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const result = await sendChatMessage(text, sessionId);

    setSending(false);

    if (result.success && result.response) {
      if (result.sessionId) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, result.sessionId);
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.response!, timestamp: Date.now() },
      ]);
      return;
    }

    setError(result.error ?? t("chatbot.genericError"));
  }

  function handleNewConversation() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setMessages([{ role: "assistant", content: t("chatbot.greeting"), timestamp: Date.now() }]);
    setError("");
    inputRef.current?.focus();
  }

  async function handleCopy(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      // Clipboard access can fail silently in some browser contexts — not
      // worth surfacing an error for a non-critical convenience feature.
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[26rem] max-w-[calc(100vw-3rem)] h-[34rem] max-h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-xl border border-black/10 flex flex-col overflow-hidden">
          <div className="bg-[#1A534A] px-5 py-4 flex items-center justify-between flex-shrink-0">
            <p className="text-white text-sm font-medium">{t("chatbot.title")}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewConversation}
                aria-label={t("chatbot.newConversation")}
                title={t("chatbot.newConversationTitle")}
                className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label={t("chatbot.closeChat")}
                className="p-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex flex-col items-end" : "flex flex-col items-start"}>
                <div
                  className={`group relative text-sm max-w-[85%] px-3.5 py-2.5 rounded-lg leading-relaxed ${
                    m.role === "user" ? "bg-[#1A534A] text-white" : "bg-[#eaf5f0] text-gray-800"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-strong:text-gray-900 prose-ul:my-1 prose-li:my-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}

                  {m.role === "assistant" && (
                    <button
                      onClick={() => handleCopy(m.content, i)}
                      aria-label={t("chatbot.copyMessage")}
                      className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 bg-white border border-black/10 rounded-full p-1 shadow-sm transition"
                    >
                      {copiedIndex === i ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">{formatTime(m.timestamp)}</span>
              </div>
            ))}

            {sending && (
              <div className="bg-[#eaf5f0] text-gray-500 text-sm max-w-[85%] px-3.5 py-2.5 rounded-lg flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {t("chatbot.thinking")}
              </div>
            )}

            {error && (
              <p role="alert" className="text-xs text-red-600 text-center">
                {error}
              </p>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center gap-2 border-t border-black/10 p-3 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={sending}
              placeholder={t("chatbot.inputPlaceholder")}
              className="flex-1 text-sm px-3.5 py-2.5 rounded-lg border border-black/10 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A534A]/40 disabled:opacity-60"
            />
            <button
              onClick={sendMessage}
              disabled={sending}
              aria-label={t("chatbot.sendMessage")}
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
        aria-label={open ? t("chatbot.closeChatbot") : t("chatbot.openChatbot")}
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