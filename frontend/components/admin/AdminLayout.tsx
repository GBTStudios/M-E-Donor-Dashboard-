import { RequireFirstLoginComplete } from "@/components/admin/RequireFirstLoginComplete";
import { SessionTimeoutGuard } from "@/components/admin/SessionTimeoutGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireFirstLoginComplete>
      <SessionTimeoutGuard>
        <div className="h-screen overflow-hidden flex bg-[#f5efe4] dark:bg-[#0f1a18]">
          {/* Sidebar — fixed height, never scrolls with the page */}
          <div className="h-full flex-shrink-0">
            <AdminSidebar />
          </div>
          {/* Right side — scrolls independently */}
          <div className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto">
            <AdminTopBar />
            <main className="flex-1 px-10 py-10">{children}</main>
          </div>
        </div>
      </SessionTimeoutGuard>
    </RequireFirstLoginComplete>
  );
}
