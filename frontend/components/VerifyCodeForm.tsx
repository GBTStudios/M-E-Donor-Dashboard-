"use client";

import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent, ClipboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { verifyResetCode, requestResetCode } from "@/lib/auth";

const CODE_LENGTH = 6;
const EXPIRY_SECONDS = 30 * 60; // 30 minutes, per the acceptance criteria.
// Note: the mockup image shows a 2:00 countdown instead, confirm with the
// backend developer which duration the real code expiry actually uses,
// then adjust EXPIRY_SECONDS to match.

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60; // client-side cooldown after too many failed attempts.
// Note: this is a UX guardrail only, not real security — the backend should
// enforce its own rate limiting on verify-reset-code independently.

export default function VerifyCodeForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [lockedOutSeconds, setLockedOutSeconds] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("resetEmail");
    if (!storedEmail) {
      router.replace("/forgot-password");
      return;
    }
    setEmail(storedEmail);
  }, [router]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (lockedOutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockedOutSeconds((s) => s - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedOutSeconds]);

  const isLockedOut = lockedOutSeconds > 0;

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/[^0-9]/g, "");

    const newDigits = [...digits];
    newDigits[index] = value ? value[value.length - 1] : "";
    setDigits(newDigits);

    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        // Clear the current box's digit.
        const newDigits = [...digits];
        newDigits[index] = "";
        setDigits(newDigits);
      } else if (index > 0) {
        // Current box is already empty: clear the previous box and move focus there.
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      }
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;

    const newDigits = Array(CODE_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    const nextIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  }

  const code = digits.join("");
  const isComplete = code.length === CODE_LENGTH;

  async function handleVerify() {
    if (isLockedOut || expired) return;

    setError("");
    setLoading(true);
    const result = await verifyResetCode(email, code);
    setLoading(false);

    if (!result.success) {
      const errorResult = result as { success: false; error: string; expired?: boolean };

      const remaining = attemptsLeft - 1;
      setAttemptsLeft(remaining);

      if (remaining <= 0) {
        setError("Too many incorrect attempts. Please wait before trying again.");
        setLockedOutSeconds(LOCKOUT_SECONDS);
        setAttemptsLeft(MAX_ATTEMPTS);
        setDigits(Array(CODE_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
      } else {
        setError(errorResult.error);
      }

      if (errorResult.expired) setExpired(true);
      return;
    }
    sessionStorage.setItem("resetVerified", "true");
    sessionStorage.setItem("resetCode", code);
    router.push("/forgot-password/reset");
  }

  async function handleResend() {
    setError("");
    setDigits(Array(CODE_LENGTH).fill(""));
    setExpired(false);
    setSecondsLeft(EXPIRY_SECONDS);
    setAttemptsLeft(MAX_ATTEMPTS);
    setLockedOutSeconds(0);
    await requestResetCode(email);
    inputRefs.current[0]?.focus();
  }

  return (
    <div>
      <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mb-4">
        <Mail className="w-5 h-5 text-teal-800" />
      </div>

      <h1 className="text-2xl font-semibold text-gray-800">Verify your email</h1>
      <p className="text-sm text-gray-500 mt-1">
        A verification code has been sent to <span className="font-medium">{email}</span>
      </p>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Verification Code</span>
        <span className={`text-sm ${expired ? "text-red-600" : "text-gray-500"}`}>
          Expires in: {formatTime(secondsLeft)}
        </span>
      </div>

      <div className="flex gap-2 mt-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={expired || isLockedOut}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className="w-11 h-11 text-center rounded-lg border border-black/10 bg-white/60 text-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-700 disabled:opacity-50"
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      {expired && !error && (
        <p className="text-sm text-red-600 mt-3">
          This code has expired. Please request a new one.
        </p>
      )}
      {isLockedOut && (
        <p className="text-sm text-red-600 mt-3">
          Try again in {formatTime(lockedOutSeconds)}.
        </p>
      )}
      {!isLockedOut && !expired && attemptsLeft < MAX_ATTEMPTS && (
        <p className="text-xs text-gray-500 mt-2">
          {attemptsLeft} attempt{attemptsLeft === 1 ? "" : "s"} remaining.
        </p>
      )}

      <button
        onClick={handleVerify}
        disabled={!isComplete || loading || expired || isLockedOut}
        className="w-full mt-4 bg-teal-800 hover:bg-teal-900 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50"
      >
        {loading ? "Verifying..." : isLockedOut ? `Try again in ${formatTime(lockedOutSeconds)}` : "Verify Account"}
      </button>

      <div className="text-center mt-4 text-sm text-gray-500">
        Didn't receive the code?{" "}
        <button onClick={handleResend} className="text-teal-700 hover:underline">
          Resend Code
        </button>
      </div>
    </div>
  );
}