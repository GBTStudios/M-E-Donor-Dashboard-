"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BarChart3, Images } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { getRole, type UserRole } from "@/lib/adminAuth";

export default function AdminDashboardPage() {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    setRole(getRole());
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-[#1A534A] mb-1.5">Admin Dashboard</h1>
      <p className="text-sm text-[#5B7571] mb-10">
        {role === "superadmin"
          ? "You have full access, including admin account management."
          : "Welcome back."}
      </p>

      <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
        <Link
          href="/admin/stats"
          className="bg-[#eaf5f0] rounded-2xl border border-black/10 p-6 shadow-sm hover:shadow-md transition block"
        >
          <BarChart3 className="w-6 h-6 text-[#1A534A] mb-3" />
          <p className="font-semibold text-gray-800">Landing Stats</p>
          <p className="text-sm text-[#5B7571] mt-1">
            Update the impact numbers shown on the public landing page.
          </p>
        </Link>

        <Link
          href="/admin/stories"
          className="bg-[#eaf5f0] rounded-2xl border border-black/10 p-6 shadow-sm hover:shadow-md transition block"
        >
          <Images className="w-6 h-6 text-[#1A534A] mb-3" />
          <p className="font-semibold text-gray-800">Impact Stories</p>
          <p className="text-sm text-[#5B7571] mt-1">
            Add, edit, or remove graduate stories shown on the landing page.
          </p>
        </Link>
      </div>

      {role === "superadmin" && (
        <div className="mt-6 max-w-2xl">
          <Link
            href="/admin/users"
            className="text-sm text-[#1A534A] font-semibold hover:underline"
          >
            Manage admin accounts →
          </Link>
        </div>
      )}
    </AdminLayout>
  );
}
