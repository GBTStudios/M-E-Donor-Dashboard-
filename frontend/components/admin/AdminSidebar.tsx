"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { getRole, type UserRole } from "@/lib/adminAuth";
import { logoutUser } from "@/lib/auth";

/**
 * Sidebar nav items matching the approved mockup's order. Everything except
 * "Dashboard" and "Manage Users" links to a page that doesn't exist yet
 * (Knowledge Base, Uploaded Documents, Q&A Logs, Chat Audit Logs, Profile,
 * Settings are all separate, unbuilt features) — these render as inert
 * placeholders (href="#") for now so the sidebar's visual layout matches
 * the mockup, without pretending those pages actually work.
 */
const PRIMARY_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin-dashboard" },
  { label: "Knowledge Base", icon: BookOpen, href: "#" },
  { label: "Uploaded Documents", icon: FileText, href: "#" },
  { label: "Q&A Logs", icon: HelpCircle, href: "#" },
  { label: "Chat Audit Logs", icon: ClipboardList, href: "#" },
] as const;

/**
 * Landing page content management — available to any admin (not
 * superadmin-only, unlike Manage Users), since editing stats/stories
 * doesn't touch account or access control.
 */
const CONTENT_NAV_ITEMS = [
  { label: "Landing Stats", icon: BarChart3, href: "/admin/stats" },
  { label: "Impact Stories", icon: Images, href: "/admin/stories" },
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
  // Treat any path under a nav item's href as "active" (e.g. /admin/stories
  // and /admin/stories/new both highlight "Impact Stories"), not just an
  // exact match.
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
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    setRole(getRole());
  }, []);

  return (
    <aside className="w-64 bg-[#1A534A] flex flex-col py-7 px-5 flex-shrink-0">
      <div className="flex items-center gap-2.5 px-1 mb-1">
        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          G
        </div>
        <span className="text-white font-semibold text-sm leading-snug">
          Groundbreaker
          <br />
          Impact
        </span>
      </div>

      <div className="px-1 mb-7">
        {role && (
          <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-[#F4C542] text-[#4a3b00] px-2 py-0.5 rounded">
            {role === "superadmin" ? "Superadmin" : "Admin"}
          </span>
        )}
      </div>

      <nav className="flex flex-col gap-1">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <NavLink key={item.label} {...item} />
        ))}
      </nav>

      <div className="my-4 border-t border-white/10" />

      <nav className="flex flex-col gap-1">
        {CONTENT_NAV_ITEMS.map((item) => (
          <NavLink key={item.label} {...item} />
        ))}
      </nav>

      <div className="my-4 border-t border-white/10" />

      <nav className="flex flex-col gap-1">
        {/* Per the RBAC contract, only superadmin can create/manage admin
            accounts — regular admins never see this link. */}
        {role === "superadmin" && (
          <NavLink label="Manage Users" icon={Users} href="/admin/users" />
        )}
        <NavLink label="Profile" icon={User} href="#" />
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
