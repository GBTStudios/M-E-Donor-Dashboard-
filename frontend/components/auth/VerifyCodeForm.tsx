"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 120; // matches the "Expires in: 2:00" shown in the design

/**
 * NOTE ON BACKEND CONTRACT: unlike signup/login, there's no documented
 * endpoint for email verification yet. The calls below (verifyEmailCode,
 * resendVerificationCode) are placeholders using a guessed shape — confirm
 * the real contract (endpoint path, request/response fields) with the
 * backend team before relying on this in production. Until then this will
 * throw/fail if pointed at a real backend, by design, rather than silently
 * pretending to succeed.
 */
async function verifyEmailCode(email: string, code: string): Promise<{ success: boolean; message: string }> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
  const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  const data = await response.json();
  if (response.ok) return { success: true, message: data.message ?? "Email verified." };
  return { success: false, message: data.detail ?? "Invalid or expired code." };
}

async function resendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
  const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (response.ok) return { success: true, message: data.message ?? "Code resent." };
  return { success: false, message: data.detail ?? "Could not resend code." };
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function VerifyCodeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const submitCode = useCallback(
    async (code: string) => {
      setError(undefined);
      setIsVerifying(true);
      try {
        const result = await verifyEmailCode(email, code);
        if (!result.success) {
          setError(result.message);
          return;
        }
        router.push("/login?verified=true");
      } catch {
        setError("We couldn't reach the server. Check your connection and try again.");
      } finally {
        setIsVerifying(false);
      }
    },
    [email, router]
  );

  function handleDigitChange(index: number, rawValue: string) {
    const value = rawValue.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "")) {
      submitCode(next.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    const lastFilledIndex = Math.min(pasted.length, CODE_LENGTH) - 1;
    inputRefs.current[lastFilledIndex]?.focus();
    if (pasted.length === CODE_LENGTH) submitCode(pasted);
  }

  async function handleResend() {
    setError(undefined);
    setIsResending(true);
    try {
      const result = await resendVerificationCode(email);
      if (!result.success) {
        setError(result.message);
        return;
      }
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      setDigits(Array(CODE_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="bg-[#DAEFEE] rounded-3xl w-full max-w-md p-8 sm:p-10 shadow-sm border border-[#C5E5E3]">
      <div className="w-11 h-11 rounded-xl bg-[#CCEAE8] flex items-center justify-center mb-5">
        <Mail className="w-5 h-5 text-[#1A534A]" />
      </div>

      <h1 className="text-2xl font-semibold text-[#1A534A] mb-1.5">Verify your email</h1>
      <p className="text-sm text-[#5B7571] mb-6">
        A verification code has been sent to <strong className="text-[#3D524C]">{email || "your email"}</strong>
      </p>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#3D524C]">Verification Code</span>
        <span className="text-sm text-[#7C9791]">
          Expires in: <span className="font-medium text-[#3D524C]">{formatTime(secondsLeft)}</span>
        </span>
      </div>

      <div className="flex gap-2 mb-2" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            aria-label={`Digit ${index + 1} of verification code`}
            disabled={isVerifying}
            className={`w-full aspect-square text-center text-lg font-semibold rounded-xl border bg-white text-[#2C3E38] focus:outline-none focus:ring-2 focus:ring-[#1A534A]/40 disabled:opacity-60 ${
              error ? "border-red-400" : "border-[#C5E5E3]"
            }`}
          />
        ))}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 mb-4">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => submitCode(digits.join(""))}
        disabled={digits.some((d) => !d) || isVerifying}
        className="w-full bg-[#1A534A] hover:bg-[#134038] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-2xl transition-colors mt-4"
      >
        {isVerifying ? "Verifying…" : "Verify Account"}
      </button>

      <div className="text-center mt-5">
        {secondsLeft > 0 ? (
          <span className="text-sm text-[#7C9791]">Didn&apos;t receive the code?</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-sm text-[#1A534A] font-semibold hover:underline disabled:opacity-50"
          >
            {isResending ? "Resending…" : "Resend Code →"}
          </button>
        )}
      </div>

      <div className="text-center mt-3 pt-3 border-t border-[#C5E5E3]">
        <a href="/signup" className="text-sm text-[#5B7571] hover:underline">
          Change email address
        </a>
      </div>
    </div>
  );
}
