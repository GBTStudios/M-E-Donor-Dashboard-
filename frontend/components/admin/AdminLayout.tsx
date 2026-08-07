import { RequireFirstLoginComplete } from "@/components/admin/RequireFirstLoginComplete";
import { SessionTimeoutGuard } from "@/components/admin/SessionTimeoutGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

/**
 * Shared shell for every protected admin page.
 *
 * The sidebar is static (always visible, never collapses or overlays).
 * min-w-0 on <main> prevents wide children (tables with min-w-[640px] etc.)
 * from blowing out the layout — it lets main shrink to available space so
 * overflow-x-auto wrappers inside actually scroll instead of pushing the page.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireFirstLoginComplete>
      <SessionTimeoutGuard>
        <div className="min-h-screen bg-[#f5efe4] dark:bg-[#0f1a18] flex">
          {/* Static sidebar — always rendered, never toggled */}
          <div className="flex-shrink-0">
            <AdminSidebar />
          </div>
          <main className="flex-1 min-w-0 px-10 py-10">{children}</main>
        </div>
      </SessionTimeoutGuard>
    </RequireFirstLoginComplete>
  );
}
