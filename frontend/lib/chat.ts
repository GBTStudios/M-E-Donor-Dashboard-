const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ChatResult {
  success: boolean;
  sessionId?: string;
  response?: string;
  error?: string;
}

/**
 * Calls POST /chat/message — public, no auth required, since this widget
 * sits on the public landing page for anonymous visitors.
 *
 * If a valid access token is present in localStorage (i.e. a donor is
 * logged in), it is included so the backend can attach the real donor
 * name to the audit log entry. If no token exists (anonymous visitor),
 * the request is sent without Authorization — same as before.
 *
 * Per the contract: send only the latest message plus session_id, not
 * full conversation history — the server holds multi-turn memory itself.
 * Response is a single JSON object, not a stream.
 */
export async function sendChatMessage(
  message: string,
  sessionId: string | null
): Promise<ChatResult> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Attach token if the donor is logged in — backend uses it to log
    // the real name instead of "Anonymous donor" in Chat Audit Logs.
    const token = typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/chat/message`, {
      method: "POST",
      headers,
      body: JSON.stringify({ session_id: sessionId, message }),
    });

    if (response.status === 200) {
      const data = await response.json();
      return { success: true, sessionId: data.session_id, response: data.response };
    }

    // Per the contract, all error responses (422, 429, 503, 504) use the
    // same { detail: "..." } shape and are handled generically here,
    // rather than needing distinct per-code UI.
    const data = await response.json().catch(() => ({}));
    return {
      success: false,
      error: data.detail ?? "Something went wrong. Please try again.",
    };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}