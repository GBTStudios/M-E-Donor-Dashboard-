"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RequireSuperadmin } from "@/components/admin/RequireSuperadmin";
import { SessionTimeoutGuard } from "@/components/admin/SessionTimeoutGuard";
import { CreateAdminForm } from "@/components/admin/CreateAdminForm";
import { AdminAccountList } from "@/components/admin/AdminAccountList";

type Tab = "add" | "manage";

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState<Tab>("add");

  return (
    <RequireSuperadmin>
      <SessionTimeoutGuard>
      <div className="min-h-screen bg-[#f5efe4] flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-[#1A534A] mb-1">User Management</h1>
            <p className="text-sm text-[#5B7571]">Manage admin accounts and access.</p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="flex gap-1 bg-white/70 border border-black/10 rounded-full p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab("add")}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${
                  activeTab === "add"
                    ? "bg-[#1A534A] text-white shadow-sm"
                    : "text-[#5B7571] hover:text-[#1A534A]"
                }`}
              >
                Add Admin
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("manage")}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${
                  activeTab === "manage"
                    ? "bg-[#1A534A] text-white shadow-sm"
                    : "text-[#5B7571] hover:text-[#1A534A]"
                }`}
              >
                Manage Accounts
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            {activeTab === "add" ? (
              <CreateAdminForm onViewAccounts={() => setActiveTab("manage")} />
            ) : (
              <AdminAccountList />
            )}
          </div>

          <div className="flex justify-center mt-8">
            <Link
              href="/admin-dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-[#5B7571] hover:text-[#1A534A] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
      </SessionTimeoutGuard>
    </RequireSuperadmin>
  );
}
