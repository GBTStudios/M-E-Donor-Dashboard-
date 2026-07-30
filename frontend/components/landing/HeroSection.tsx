import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="bg-[#f5efe4]">
      <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block bg-white/70 border border-black/10 text-xs font-medium text-gray-600 px-3 py-1.5 rounded-full mb-5">
            Monitoring &amp; Evaluation, made transparent
          </span>

          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
            See exactly how your funding changes a life — before you give
            another dollar.
          </h1>

          <p className="text-gray-500 mt-5 max-w-md">
            Groundbreaker Impact gives donors verified, AI-grounded visibility
            into real outcomes — tracked from intake through graduation and
            into every graduate&apos;s career.
          </p>

          <div className="flex items-center gap-3 mt-7">
            <Link
              href="#impact"
              className="inline-flex items-center gap-2 bg-[#1A534A] hover:bg-[#134038] text-white text-sm font-medium px-5 py-3 rounded-lg transition"
            >
              Explore Impact
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center bg-white border border-black/10 text-gray-800 text-sm font-medium px-5 py-3 rounded-lg hover:bg-white/70 transition"
            >
              Sign In
            </Link>
          </div>
        </div>

        <JourneyCard />
      </div>
    </section>
  );
}

function JourneyCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-semibold tracking-wide text-[#1A534A]">
          THE JOURNEY WE TRACK
        </span>
        <span className="text-xs text-gray-400">After graduation</span>
      </div>

      <svg viewBox="0 0 400 160" className="w-full h-auto" role="img" aria-label="Income growth trend from before the programme to after graduation">
        <path
          d="M 20 130 C 100 128, 160 110, 220 80 C 270 55, 320 35, 375 25"
          fill="none"
          stroke="#1A534A"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="20" cy="130" r="5" fill="white" stroke="#1A534A" strokeWidth="2.5" />
        <circle cx="375" cy="25" r="5" fill="#1A534A" />
        <line x1="20" y1="140" x2="375" y2="140" stroke="#E4DFD1" strokeWidth="1" strokeDasharray="3 4" />
      </svg>

      <div className="flex items-start justify-between -mt-2">
        <div>
          <p className="text-lg font-semibold text-gray-800">$11/month</p>
          <p className="text-xs text-gray-400">Before the programme</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-[#1A534A]">22&times; income</p>
        </div>
      </div>

      <p className="text-[11px] text-gray-400 text-center mt-4">
        Based on verified net income, baseline vs. post-graduation
      </p>
    </div>
  );
}