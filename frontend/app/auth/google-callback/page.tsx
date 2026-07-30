"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeGoogleLogin } from "@/lib/auth";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    async function finishLogin() {
      const result = await completeGoogleLogin();
      if (!result.success) {
        const errorResult = result as { success: false; error: string };
        setError(errorResult.error);
        return;
      }
      router.push("/dashboard");
    }
    finishLogin();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5efe4] px-4">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-600 mb-4">{error}</p>
            <a href="/login" className="text-teal-700 hover:underline">
              Return to login
            </a>
          </>
        ) : (
          <p className="text-gray-600">Signing you in...</p>
        )}
      </div>
    </div>
  );
}