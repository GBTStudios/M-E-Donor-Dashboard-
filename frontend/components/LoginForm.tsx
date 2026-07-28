"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { loginUser } from "@/lib/auth";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  const bothFieldsFilled = email.trim().length > 0 && password.length > 0;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter both your email and password.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const result = await loginUser(email, password, keepSignedIn);
    setLoading(false);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Welcome back</h1>
      <p className="text-sm text-gray-500 mt-1">
        Enter your credentials to access your impact dashboard.
      </p>

      <button
        type="button"
        className="w-full mt-6 flex items-center justify-center gap-2 border border-black/10 rounded-lg py-2.5 bg-[#f5efe4] hover:bg-[#efe8db] transition"
      >
        <GoogleIcon />
        <span className="text-sm text-gray-700">Sign in with Google</span>
      </button>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-black/10" />
        <span className="text-xs text-gray-400 tracking-wide">
          OR SIGN IN WITH EMAIL
        </span>
        <div className="flex-1 h-px bg-black/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Work Email
          </label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@organization.org"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-black/10 bg-white/60 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <a href="/forgot-password" className="text-xs text-teal-700 hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="relative mt-1">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-black/10 bg-white/60 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={keepSignedIn}
            onChange={(e) => setKeepSignedIn(e.target.checked)}
            className="rounded border-black/20 accent-teal-700"
          />
          Keep me signed in for 30 days
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!bothFieldsFilled || loading}
          className="w-full flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign in to Platform"}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>

        <p className="text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <a href="/signup" className="text-teal-700 hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.5 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l6.1-6.1C34.6 5.9 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 12.7 24 12.7c3.1 0 5.9 1.2 8 3.1l6.1-6.1C34.6 5.9 29.6 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/>
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-1.8 14-4.9l-6.5-5.5C29.6 35.6 26.9 36.5 24 36.5c-5.4 0-9.9-3.5-11.5-8.4l-6.6 5.1C9.5 39.7 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.7-3.7 5l6.5 5.5C41.3 35.3 44 30 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}