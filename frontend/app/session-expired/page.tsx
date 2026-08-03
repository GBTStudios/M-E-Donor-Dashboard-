import Link from "next/link";
import { Clock } from "lucide-react";

export default function SessionExpiredPage() {
  return (
    <div className="min-h-screen bg-[#f5efe4] flex flex-col items-center justify-center px-6 py-12">
      <div className="bg-[#eaf5f0] rounded-2xl w-full max-w-md p-8 shadow-sm border border-black/10 text-center">
        <div className="w-12 h-12 rounded-full bg-[#CCEAE8] flex items-center justify-center mx-auto mb-5">
          <Clock className="w-6 h-6 text-[#1A534A]" />
        </div>
        <h1 className="text-xl font-semibold text-[#1A534A] mb-2">Session expired</h1>
        <p className="text-sm text-[#5B7571] mb-6">
          Your session expired due to inactivity. Please log in again to continue.
        </p>
        <Link
          href="/login"
          className="inline-block w-full bg-[#1A534A] hover:bg-[#134038] text-white text-sm font-semibold py-2.5 rounded-full transition-colors"
        >
          Log In Again
        </Link>
      </div>
    </div>
  );
}
