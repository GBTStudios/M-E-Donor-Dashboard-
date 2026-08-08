import { RequireFirstLoginComplete } from "@/components/admin/RequireFirstLoginComplete";
import { SessionTimeoutGuard } from "@/components/admin/SessionTimeoutGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";

/**
 * Shared shell for every protected admin page — static sidebar, top bar
 * with profile avatar, and first-login + session-timeout guards.
 *
 * min-w-0 on <main> prevents wide children (tables etc.) from blowing out
 * the layout — lets main shrink to available space so overflow-x-auto
 * wrappers inside actually scroll instead of pushing the page wider.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireFirstLoginComplete>
      <SessionTimeoutGuard>
        <div className="min-h-screen bg-[#f5efe4] dark:bg-[#0f1a18] flex">
          {/* Static sidebar */}
          <div className="flex-shrink-0">
            <AdminSidebar />
          </div>

          {/* Right side: top bar + page content */}
          <div className="flex-1 min-w-0 flex flex-col">
            <AdminTopBar />
            <main className="flex-1 px-10 py-10">{children}</main>
          </div>
        </div>
      </SessionTimeoutGuard>
    </RequireFirstLoginComplete>
  );
}
