"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { RequireFirstLoginComplete } from "@/components/admin/RequireFirstLoginComplete";
import { SessionTimeoutGuard } from "@/components/admin/SessionTimeoutGuard";
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
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin-dashboard", active: true },
  { label: "Knowledge Base", icon: BookOpen, href: "#", active: false },
  { label: "Uploaded Documents", icon: FileText, href: "#", active: false },
  { label: "Q&A Logs", icon: HelpCircle, href: "#", active: false },
  { label: "Chat Audit Logs", icon: ClipboardList, href: "#", active: false },
] as const;

function NavLink({
  label,
  icon: Icon,
  href,
  active = false,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  active?: boolean;
}) {
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

function DashboardContent() {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    setRole(getRole());
  }, []);

  return (
    <div className="min-h-screen bg-[#f5efe4] flex">
      {/* Sidebar */}
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

      {/* Main content */}
      <main className="flex-1 px-10 py-10">
        <h1 className="text-2xl font-semibold text-[#1A534A] mb-1.5">Admin Dashboard</h1>
        <p className="text-sm text-[#5B7571] mb-10">
          {role === "superadmin"
            ? "You have full access, including admin account management."
            : "Welcome back."}
        </p>

        <div className="bg-[#eaf5f0] rounded-2xl border border-black/10 p-10 text-center text-[#5B7571] text-sm max-w-lg shadow-sm">
          Dashboard content (donor metrics, knowledge base, etc.) is being built separately.
          {role === "superadmin" && (
            <>
              {" "}
              In the meantime, use{" "}
              <Link href="/admin/users" className="text-[#1A534A] font-semibold hover:underline">
                Manage Users
              </Link>{" "}
              to add or manage admin accounts.
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequireFirstLoginComplete>
      <SessionTimeoutGuard>
        <DashboardContent />
      </SessionTimeoutGuard>
    </RequireFirstLoginComplete>
  );
}
