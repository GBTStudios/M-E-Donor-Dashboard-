import Link from "next/link";

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 bg-[#1A534A]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-white font-semibold text-lg">
          Groundbreaker Impact
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="#impact" className="text-sm text-white/90 hover:text-white transition">
            Impact
          </Link>
          <Link href="#how-it-works" className="text-sm text-white/90 hover:text-white transition">
            How It Works
          </Link>
          <Link href="#data-trust" className="text-sm text-white/90 hover:text-white transition">
            Data &amp; Trust
          </Link>
          <Link href="#faq" className="text-sm text-white/90 hover:text-white transition">
            FAQ
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/donate"
            className="bg-white text-[#1A534A] text-sm font-medium px-4 py-2 rounded-full hover:bg-white/90 transition"
          >
            Donate
          </Link>
          <Link
            href="/signup"
            className="bg-white/15 text-white text-sm font-medium px-4 py-2 rounded-full border border-white/20 hover:bg-white/25 transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}