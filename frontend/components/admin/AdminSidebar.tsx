"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  HelpCircle,
  ClipboardList,
  Users,
  User,
  Settings,
  LogOut,
  BarChart3,
  Images,
  Upload,
} from "lucide-react";
import { getRole, type UserRole } from "@/lib/adminAuth";
import { logoutUser } from "@/lib/auth";

const PRIMARY_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin-dashboard" },
  { label: "Knowledge Base", icon: BookOpen, href: "/admin/knowledge-base" },
  { label: "Uploaded Documents", icon: FileText, href: "/admin/documents" },
  { label: "Q&A Logs", icon: HelpCircle, href: "/admin/qa-logs" },
  { label: "Chat Audit Logs", icon: ClipboardList, href: "/admin/audit-logs" },
] as const;

const CONTENT_NAV_ITEMS = [
  { label: "Landing Stats", icon: BarChart3, href: "/admin/stats" },
  { label: "Impact Stories", icon: Images, href: "/admin/stories" },
  { label: "Cohort Projects", icon: Images, href: "/admin/cohorts" },
  { label: "Participant Data", icon: Upload, href: "/admin/participants" },
  { label: "Reports", icon: FileText, href: "/admin/reports" },
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

export default function AdminSidebar() {
  const [role] = useState<UserRole | null>(() => getRole());

  return (
    // Sidebar is now three vertical zones: a fixed header, a middle nav
    // section that's the ONLY part allowed to scroll if content is taller
    // than the window, and a fixed footer. This guarantees Logout (and the
    // logo/badge) are always visible and clickable regardless of screen
    // height or how many nav items exist — only the nav list itself is
    // ever at risk of scrolling, never the whole sidebar.
    <aside className="w-64 h-full bg-[#1A534A] flex flex-col flex-shrink-0 overflow-hidden">
      {/* Fixed header — never scrolls */}
      <div className="flex-shrink-0 px-5 pt-7">
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

        <div className="px-1 mb-4">
          {role && (
            <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-[#F4C542] text-[#4a3b00] px-2 py-0.5 rounded">
              {role === "superadmin" ? "Superadmin" : "Admin"}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable middle — nav links only. On a screen tall enough to
          fit everything (the common case), this never shows a scrollbar
          and looks identical to a fully static sidebar. It only becomes
          scrollable on genuinely short viewports, and even then, only
          this section scrolls — logo and Logout stay put. */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-5 flex flex-col gap-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <NavLink key={item.label} {...item} />
        ))}

        <div className="my-3 border-t border-white/10" />

        {CONTENT_NAV_ITEMS.map((item) => (
          <NavLink key={item.label} {...item} />
        ))}

        <div className="my-3 border-t border-white/10" />

        {role === "superadmin" && (
          <NavLink label="Manage Users" icon={Users} href="/admin/users" />
        )}
        <NavLink label="Profile" icon={User} href="/admin/profile" />
        <NavLink label="Settings" icon={Settings} href="/admin/settings" />
      </nav>

      {/* Fixed footer — always visible, always clickable */}
      <div className="flex-shrink-0 px-5 pb-7 pt-4 border-t border-white/10">
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
