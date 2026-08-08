"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRole, type UserRole } from "@/lib/adminAuth";
import { getMyProfile, type StaffProfile } from "@/lib/profile";

const ACCESS_TOKEN_KEY = "access_token";

export default function AdminTopBar() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);

  useEffect(() => {
    setRole(getRole());

    async function loadProfile() {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!accessToken) return;
      const result = await getMyProfile(accessToken);
      if (result.success) setProfile(result.profile);
    }
    loadProfile();
  }, []);

  const displayName = profile?.fullName ?? "Admin";
  const displayRole = role === "superadmin" ? "Superadmin" : "Admin";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="h-16 bg-white dark:bg-[#0f1a18] border-b border-black/5 dark:border-white/10 flex items-center justify-end px-8 flex-shrink-0">
      <Link
        href="/admin/profile"
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-[#1A534A] dark:text-[#7dd3c0] leading-tight">
            {displayName}
          </p>
          <p className="text-xs text-[#5B7571] dark:text-[#8fada9]">{displayRole}</p>
        </div>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#CCEAE8] dark:bg-[#2a6b5e] overflow-hidden flex items-center justify-center flex-shrink-0 ring-2 ring-[#1A534A]/20 dark:ring-[#7dd3c0]/20">
          {profile?.profilePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profilePhotoUrl}
              alt={displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-[#1A534A] dark:text-[#7dd3c0]">
              {initial}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
