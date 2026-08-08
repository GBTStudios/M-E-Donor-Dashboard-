import AdminLayout from "@/components/admin/AdminLayout";
import { NotificationSettings } from "@/components/admin/NotificationSettings";
import { ThemeSettings } from "@/components/admin/ThemeSettings";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { ActiveSessionsList } from "@/components/admin/ActiveSessionsList";

/**
 * NOTE: the approved mockup for this page also shows "Regional Preferences"
 * (language/timezone). There's still no backend contract for that — no
 * documented endpoint to persist a language or timezone choice. Rather than
 * build UI that doesn't actually save anything, that section is omitted
 * until it has a real contract, same as Notifications/Theme were until
 * Racheal's latest contract added them.
 */
export default function SettingsPage() {
  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#1A534A] mb-1">Settings</h1>
        <p className="text-sm text-[#5B7571] mb-8">Manage your preferences, security, and access.</p>

        <div className="flex flex-col gap-6">
          <NotificationSettings />
          <ThemeSettings />
          <ChangePasswordForm />
          <ActiveSessionsList />
        </div>
      </div>
    </AdminLayout>
  );
}
