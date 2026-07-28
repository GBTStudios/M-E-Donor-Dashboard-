import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// next/font self-hosts Google Fonts at build time (no runtime request to
// Google, better privacy and performance than a <link> tag), and exposes
// the font as a CSS variable so it can be referenced from Tailwind classes
// or plain CSS via var(--font-inter).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Groundbreaker Impact",
    // Pages can override just their own segment, e.g. "Sign Up · Groundbreaker Impact"
    template: "%s · Groundbreaker Impact",
  },
  description:
    "Verified impact data and an AI-grounded assistant for Groundbreaker's donors and funding partners.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
