"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
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

interface NavItem {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", icon: LayoutDashboard, href: "/donor-dashboard", exact: true },
  { key: "cohorts", icon: Users, href: "/donor/cohorts" },
  { key: "stories", icon: Sparkles, href: "/donor-dashboard/stories" },
  { key: "reports", icon: FileText, href: "/donor-dashboard/reports" },
];

function NavLink({
  label,
  icon: Icon,
  href,
  exact,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active =
    href !== "#" &&
    (pathname === href || (!exact && pathname?.startsWith(href + "/")));
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
  const { t } = useTranslation("donor");

  return (
    <aside className="w-64 h-screen sticky top-0 bg-[#1A534A] flex flex-col py-7 px-5 flex-shrink-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-1 mb-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Groundbreaker"
          width={36}
          height={36}
          className="object-contain rounded-lg flex-shrink-0"
        />
        <span className="text-white font-semibold text-sm leading-snug">
          Groundbreaker
          <br />
          Impact
        </span>
      </div>

      <div className="px-1 mb-7">
        <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-white/10 text-white/80 px-2 py-0.5 rounded">
          {t("sidebar.badge")}
        </span>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.key}
            label={t(`sidebar.nav.${item.key}`)}
            icon={item.icon}
            href={item.href}
            exact={item.exact}
          />
        ))}
      </nav>

      <div className="my-4 border-t border-white/10" />

      <nav className="flex flex-col gap-1">
        <NavLink label={t("sidebar.nav.profile")} icon={User} href="/donor/profile" />
        <NavLink label={t("sidebar.nav.settings")} icon={Settings} href="/donor/settings" />
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
          {t("sidebar.nav.logout")}
        </button>
      </div>
    </aside>
  );
}
