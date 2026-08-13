"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  FileText,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { logoutUser } from "@/lib/auth";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/donor-dashboard" },
  { label: "Cohorts", icon: Users, href: "/donor/cohorts" },
  { label: "Success Stories", icon: Sparkles, href: "#" },
  { label: "Reports", icon: FileText, href: "#" },
] as const;

function NavLink({
  label,
  icon: Icon,
  href,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}) {
  const pathname = usePathname();
  const active = href !== "#" && (pathname === href || pathname?.startsWith(href + "/"));

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-white/15 text-white"
          : "text-white/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {label}
    </Link>
  );
}

export default function DonorSidebar() {
  return (
    <aside className="w-64 h-screen sticky top-0 bg-[#1A534A] flex flex-col py-7 px-5 flex-shrink-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-1 mb-1">
        <Image
          src="/logo.png"
          alt="Groundbreaker"
          width={36}
          height={36}
          className="object-contain"
        />
        <span className="text-white font-bold text-sm leading-snug">
          Groundbreaker
          <br />
          <span className="font-normal text-white/75">Impact</span>
        </span>
      </div>

      <div className="px-1 mb-7">
        <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-white/10 text-white/80 px-2 py-0.5 rounded">
          Donor
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.label} {...item} />
        ))}
      </nav>

      <div className="my-4 border-t border-white/10" />

      <nav className="flex flex-col gap-1">
        <NavLink label="Profile" icon={User} href="/donor/profile" />
        <NavLink label="Settings" icon={Settings} href="#" />
      </nav>

      <div className="flex-1" />

      <div className="pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => {
            logoutUser();
            window.location.href = "/login";
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/75 hover:bg-white/10 hover:text-white text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
