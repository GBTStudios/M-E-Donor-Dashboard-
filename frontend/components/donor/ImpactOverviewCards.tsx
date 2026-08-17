"use client";

import { useTranslation } from "react-i18next";
import { Users, GraduationCap, Briefcase, TrendingUp, Layers, Heart, Globe, Building2, ArrowUpRight } from "lucide-react";
import type { DashboardSummary } from "@/lib/donorDashboard";

function RingStat({ pct, color }: { pct: number; color: string }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={radius} fill="none" stroke="#eee" strokeWidth="5" />
      <circle
        cx="26"
        cy="26"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
      />
    </svg>
  );
}

export default function ImpactOverviewCards({ summary }: { summary: DashboardSummary }) {
  const { t } = useTranslation("donor");

  const cards = [
    {
      label: t("dashboard.cards.participants.label"),
      value: summary.participants,
      suffix: "",
      icon: Users,
      note: t("dashboard.cards.participants.note"),
    },
    {
      label: t("dashboard.cards.graduationRate.label"),
      value: summary.graduation_rate,
      suffix: "%",
      icon: GraduationCap,
      note: t("dashboard.cards.graduationRate.note"),
    },
    {
      label: t("dashboard.cards.employmentRate.label"),
      value: summary.employment_rate,
      suffix: "%",
      icon: Briefcase,
      note: t("dashboard.cards.employmentRate.note"),
    },
    {
      label: t("dashboard.cards.incomeGrowth.label"),
      value: summary.income_growth_multiplier,
      suffix: "×",
      icon: TrendingUp,
      note: t("dashboard.cards.incomeGrowth.note"),
      accent: true,
    },
    {
      label: t("dashboard.cards.activeCohorts.label"),
      value: summary.cohorts,
      suffix: "",
      icon: Layers,
      note: t("dashboard.cards.activeCohorts.note"),
    },
    {
      label: t("dashboard.cards.refugeeInclusion.label"),
      value: summary.refugee_participants_pct,
      suffix: "%",
      icon: Heart,
      note: t("dashboard.cards.refugeeInclusion.note"),
      ring: true,
    },
    {
      label: t("dashboard.cards.internationalRoles.label"),
      value: summary.international_roles_pct,
      suffix: "%",
      icon: Globe,
      note: t("dashboard.cards.internationalRoles.note"),
      ring: true,
    },
    {
      label: t("dashboard.cards.africanCompanies.label"),
      value: summary.african_companies_pct,
      suffix: "%",
      icon: Building2,
      note: t("dashboard.cards.africanCompanies.note"),
      ring: true,
    },
    {
      label: t("dashboard.cards.incomeSentHome.label"),
      value: summary.income_sent_home_pct,
      suffix: "%",
      icon: ArrowUpRight,
      note: t("dashboard.cards.incomeSentHome.note"),
      accent: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-black/5 shadow-sm p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  {card.label}
                </p>
                <p className={`text-3xl font-bold mt-1 ${card.accent ? "text-orange-500" : "text-gray-900"}`}>
                  {card.value}
                  <span className="text-lg">{card.suffix}</span>
                </p>
              </div>
              {card.ring ? (
                <RingStat pct={card.value} color="#1A534A" />
              ) : (
                <Icon className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">{card.note}</p>
          </div>
        );
      })}
    </div>
  );
}