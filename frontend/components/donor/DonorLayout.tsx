import DonorSidebar from "@/components/donor/DonorSidebar";
import ChatbotButton from "@/components/landing/ChatbotButton";
import { DonorSessionTimeoutGuard } from "@/components/donor/DonorSessionTimeoutGuard";

/**
 * Shared shell for donor pages. Now wrapped with DonorSessionTimeoutGuard —
 * mirrors admin's 30-minute inactivity timeout (with a 25-minute warning
 * toast), redirecting to /session-expired via lib/sessionTimeout.ts.
 *
 * Layout is locked to the viewport height (h-screen + overflow-hidden) so the
 * sidebar never scrolls with page content — only <main> scrolls internally.
 * This keeps the sidebar (and Logout) fixed in place regardless of how tall
 * the page content is.
 */
export default function DonorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DonorSessionTimeoutGuard>
      <div className="h-screen bg-[#f5efe4] flex overflow-hidden">
        <DonorSidebar />
        <main className="flex-1 min-w-0 px-10 py-10 overflow-y-auto">{children}</main>
        <ChatbotButton />
      </div>
    </DonorSessionTimeoutGuard>
  );
}
