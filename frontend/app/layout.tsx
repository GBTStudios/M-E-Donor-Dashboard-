import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import I18nInit from "@/components/I18nInit";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Groundbreaker Impact",
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
      <body>
        <I18nInit>
          <ThemeProvider>{children}</ThemeProvider>
        </I18nInit>
      </body>
    </html>
  );
}
