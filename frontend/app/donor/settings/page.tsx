"use client";

import { useTranslation } from "react-i18next";
import DonorLayout from "@/components/donor/DonorLayout";
import { DonorNotificationSettings } from "@/components/donor/DonorNotificationSettings";
import { DonorRegionalPreferences } from "@/components/donor/DonorRegionalPreferences";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { ActiveSessionsList } from "@/components/admin/ActiveSessionsList";

export default function DonorSettingsPage() {
  const { t } = useTranslation("donor");
  return (
    <DonorLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#1A534A] mb-1">{t("settings.heading")}</h1>
        <p className="text-sm text-[#5B7571] mb-8">{t("settings.subheading")}</p>
        <div className="flex flex-col gap-6">
          <DonorNotificationSettings />
          <DonorRegionalPreferences />
          <ChangePasswordForm />
          <ActiveSessionsList />
        </div>
      </div>
    </DonorLayout>
  );
}
