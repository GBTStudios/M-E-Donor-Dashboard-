"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import DonorLayout from "@/components/donor/DonorLayout";
import ImpactOverviewCards from "@/components/donor/ImpactOverviewCards";
import BaselinePanel from "@/components/donor/BaselinePanel";
import CohortProgressList from "@/components/donor/CohortProgressList";
import StrategicInsights from "@/components/donor/StrategicInsights";
import OriginsMap from "@/components/donor/OriginsMap";
import {
  fetchDashboardSummary,
  fetchCohorts,
  fetchInsights,
  fetchBaseline,
  fetchOrigins,
  DashboardSummary,
  Cohort,
  Insight,
  BaselineData,
  OriginsData,
} from "@/lib/donorDashboard";

export default function DonorDashboardPage() {
  const { t } = useTranslation("donor");
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [baseline, setBaseline] = useState<BaselineData | null>(null);
  const [origins, setOrigins] = useState<OriginsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    async function load() {
      const [summaryRes, cohortsRes, insightsRes, baselineRes, originsRes] = await Promise.all([
        fetchDashboardSummary(),
        fetchCohorts(),
        fetchInsights(),
        fetchBaseline(),
        fetchOrigins(),
      ]);
      const anyUnauthorized = [summaryRes, cohortsRes, insightsRes, baselineRes, originsRes].some(
        (r) => r.status === 401
      );
      if (anyUnauthorized) {
        router.replace("/session-expired");
        return;
      }
      if (summaryRes.success && summaryRes.summary) setSummary(summaryRes.summary);
      if (cohortsRes.success && cohortsRes.cohorts) setCohorts(cohortsRes.cohorts);
      if (insightsRes.success && insightsRes.insights) setInsights(insightsRes.insights);
      if (baselineRes.success && baselineRes.baseline) setBaseline(baselineRes.baseline);
      if (originsRes.success && originsRes.origins) setOrigins(originsRes.origins);
      if (!summaryRes.success) {
        setError(summaryRes.error ?? t("errors.dashboard.couldNotLoadSummary"));
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);
  if (loading) {
    return (
      <DonorLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </DonorLayout>
    );
  }
  return (
    <DonorLayout>
      <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.heading")}</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        {t("dashboard.description")}
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-600 mb-4">
          {error}
        </p>
      )}
      <div className="grid lg:grid-cols-[1fr_2fr] gap-5 items-start">
        {baseline && <BaselinePanel baseline={baseline} />}
        {summary && <ImpactOverviewCards summary={summary} />}
      </div>
      <div className="mt-6">
        <CohortProgressList cohorts={cohorts} />
      </div>
      <div className="grid lg:grid-cols-2 gap-5 mt-6">
        <StrategicInsights insights={insights} />
        {origins && <OriginsMap origins={origins} />}
      </div>
    </DonorLayout>
  );
}