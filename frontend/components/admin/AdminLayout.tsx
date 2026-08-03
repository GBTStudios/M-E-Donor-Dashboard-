import { RequireFirstLoginComplete } from "@/components/admin/RequireFirstLoginComplete";
import { SessionTimeoutGuard } from "@/components/admin/SessionTimeoutGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";

/**
 * Shared shell for every protected admin page — sidebar plus first-login
 * and session-timeout guards, once, in one place. Wrap any admin page's
 * content with this instead of each page re-implementing its own sidebar
 * and guard wrapping.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireFirstLoginComplete>
      <SessionTimeoutGuard>
        <div className="min-h-screen bg-[#f5efe4] flex">
          <AdminSidebar />
          <main className="flex-1 px-10 py-10">{children}</main>
        </div>
      </SessionTimeoutGuard>
    </RequireFirstLoginComplete>
  );
}
