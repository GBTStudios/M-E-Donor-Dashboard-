"use client";

import { useTranslation } from "react-i18next";
import DonorLayout from "@/components/donor/DonorLayout";
import { DonorProfileCard } from "@/components/donor/DonorProfileCard";

export default function DonorProfilePage() {
  const { t } = useTranslation("donor");
  return (
    <DonorLayout>
      <h1 className="text-2xl font-semibold text-[#1A534A] mb-6">{t("profile.heading")}</h1>
      <DonorProfileCard />
    </DonorLayout>
  );
}
