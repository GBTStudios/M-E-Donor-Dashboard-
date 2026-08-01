"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#impact", label: "Impact" },
  { href: "#faq", label: "FAQ" },
];

export default function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#1A534A]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-white font-semibold text-lg">
          Groundbreaker Impact
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-white/90 hover:text-white transition"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
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

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="md:hidden text-white p-1.5"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[#1A534A] border-t border-white/10 px-6 py-4">
          <nav className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-white/90 hover:text-white transition"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 mt-5">
            <Link
              href="/donate"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center bg-white text-[#1A534A] text-sm font-medium px-4 py-2.5 rounded-full hover:bg-white/90 transition"
            >
              Donate
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center bg-white/15 text-white text-sm font-medium px-4 py-2.5 rounded-full border border-white/20 hover:bg-white/25 transition"
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}