import { RequireFirstLoginComplete } from "@/components/admin/RequireFirstLoginComplete";
import { SessionTimeoutGuard } from "@/components/admin/SessionTimeoutGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

/**
 * Shared shell for every protected admin page — sidebar plus first-login
 * and session-timeout guards, once, in one place. Wrap any admin page's
 * content with this instead of each page re-implementing its own sidebar
 * and guard wrapping.
 *
 * min-w-0 on <main> matters here: flex children default to never shrinking
 * below their content's natural width, so a wide child (like a table with
 * min-w-[640px]) would otherwise push the whole page wider instead of
 * scrolling within its own container. min-w-0 allows main to shrink to
 * the available space, so overflow-x-auto wrappers inside actually work.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireFirstLoginComplete>
      <SessionTimeoutGuard>
        <div className="min-h-screen bg-[#f5efe4] flex">
          <AdminSidebar />
          <main className="flex-1 min-w-0 px-10 py-10">{children}</main>
        </div>
      </SessionTimeoutGuard>
    </RequireFirstLoginComplete>
  );
}
