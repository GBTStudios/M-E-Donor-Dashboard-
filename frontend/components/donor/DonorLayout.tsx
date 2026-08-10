import DonorSidebar from "@/components/donor/DonorSidebar";
import ChatbotButton from "@/components/landing/ChatbotButton";

/**
 * Shared shell for donor pages. Unlike AdminLayout, no RequireFirstLoginComplete
 * or SessionTimeoutGuard wrapping — those are admin-onboarding specific. Donor
 * routes just need a valid logged-in user; individual fetch calls already
 * handle 401 by redirecting to /login.
 *
 * Layout is locked to the viewport height (h-screen + overflow-hidden) so the
 * sidebar never scrolls with page content — only <main> scrolls internally.
 * This keeps the sidebar (and Logout) fixed in place regardless of how tall
 * the page content is.
 */
export default function DonorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-[#f5efe4] flex overflow-hidden">
      <DonorSidebar />
      <main className="flex-1 min-w-0 px-10 py-10 overflow-y-auto">{children}</main>
      <ChatbotButton />
    </div>
  );
}