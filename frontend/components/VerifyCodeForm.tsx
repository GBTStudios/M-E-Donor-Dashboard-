"use client";

import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { verifyResetCode, requestResetCode } from "@/lib/auth";

const CODE_LENGTH = 6;
const EXPIRY_SECONDS = 30 * 60; // 30 minutes, per the acceptance criteria.
// Note: the mockup image shows a 2:00 countdown instead, confirm with the
// backend developer which duration the real code expiry actually uses,
// then adjust EXPIRY_SECONDS to match.

export default function VerifyCodeForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(EXPIRY_SECONDS);
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

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function handleChange(index: number, e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (!value) return;

    const newDigits = [...digits];
    newDigits[index] = value[value.length - 1];
    setDigits(newDigits);

    if (index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  const code = digits.join("");
  const isComplete = code.length === CODE_LENGTH;

  async function handleVerify() {
    setError("");
    setLoading(true);
    const result = await verifyResetCode(email, code);
    setLoading(false);

    if (result.success) {
      sessionStorage.setItem("resetVerified", "true");
      router.push("/forgot-password/reset");
    } else {
      setError(result.error);
      if (result.expired) setExpired(true);
    }
  }

  async function handleResend() {
    setError("");
    setDigits(Array(CODE_LENGTH).fill(""));
    setExpired(false);
    setSecondsLeft(EXPIRY_SECONDS);
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
            disabled={expired}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-11 h-11 text-center rounded-lg border border-black/10 bg-white/60 text-lg focus:outline-none focus:ring-2 focus:ring-teal-700 disabled:opacity-50"
          />
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      {expired && !error && (
        <p className="text-sm text-red-600 mt-3">
          This code has expired. Please request a new one.
        </p>
      )}

      <button
        onClick={handleVerify}
        disabled={!isComplete || loading || expired}
        className="w-full mt-4 bg-teal-800 hover:bg-teal-900 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Verify Account"}
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