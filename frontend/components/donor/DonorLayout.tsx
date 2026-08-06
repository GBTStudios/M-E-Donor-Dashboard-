import DonorSidebar from "@/components/donor/DonorSidebar";

/**
 * Shared shell for donor pages. Unlike AdminLayout, no RequireFirstLoginComplete
 * or SessionTimeoutGuard wrapping — those are admin-onboarding specific. Donor
 * routes just need a valid logged-in user; individual fetch calls already
 * handle 401 by redirecting to /login.
 */
export default function DonorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5efe4] flex">
      <DonorSidebar />
      <main className="flex-1 min-w-0 px-10 py-10">{children}</main>
    </div>
  );
}
