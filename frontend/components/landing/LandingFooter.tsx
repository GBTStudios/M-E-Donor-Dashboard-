import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="bg-[#1A534A] pt-16 pb-10">
      <div className="max-w-6xl mx-auto px-6 grid sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <p className="text-white font-semibold">Groundbreaker Impact</p>
          <p className="text-white/70 text-sm mt-3 max-w-xs">
            Bridging the trust gap in international development through rigorous data
            verification and transparent reporting.
          </p>
        </div>

        <div>
          <p className="text-white/50 text-xs font-semibold tracking-wide uppercase mb-3">
            Dashboard
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="#impact" className="text-white/80 text-sm hover:text-white transition">
                Impact
              </Link>
            </li>
            <li>
              <Link href="#how-it-works" className="text-white/80 text-sm hover:text-white transition">
                How It Works
              </Link>
            </li>
            <li>
              <Link href="#data-trust" className="text-white/80 text-sm hover:text-white transition">
                Data &amp; Trust
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-white/50 text-xs font-semibold tracking-wide uppercase mb-3">
            Access
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/signup" className="text-white/80 text-sm hover:text-white transition">
                Sign Up
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-white/80 text-sm hover:text-white transition">
                Login
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-white/50 text-xs font-semibold tracking-wide uppercase mb-3">
            Contact Us
          </p>
          <a
            href="mailto:team@groundbreaker.org"
            className="text-white/80 text-sm hover:text-white transition"
          >
            team@groundbreaker.org
          </a>
        </div>
      </div>
    </footer>
  );
}