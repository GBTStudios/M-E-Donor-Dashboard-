"use client";

import { useState, useEffect } from "react";
import { Download, FileText, Loader2, Eye } from "lucide-react";
import DonorLayout from "@/components/donor/DonorLayout";
import ReportViewerModal from "@/components/ui/ReportViewerModal";
import {
  fetchReports,
  fetchReportUrl,
  fetchCohortReportUrl,
  downloadImpactSummary,
  ReportListItem,
} from "@/lib/donorReports";

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function DonorReportsPage() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [reportsError, setReportsError] = useState("");

  const [viewTarget, setViewTarget] = useState<ReportListItem | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    async function load() {
      const result = await fetchReports();
      if (result.success && result.reports) {
        setReports(result.reports);
      } else if (result.error) {
        setReportsError(result.error);
      }
      setLoadingReports(false);
    }
    load();
  }, []);

  async function handleView(report: ReportListItem) {
    setViewTarget(report);
    setViewUrl(null);
    setViewError("");
    setViewLoading(true);

    const direct = await fetchReportUrl(report.id);
    if (direct.success && direct.file_url) {
      setViewLoading(false);
      setViewUrl(direct.file_url);
      return;
    }

    if (report.cohort_id) {
      const viaCohort = await fetchCohortReportUrl(report.cohort_id);
      setViewLoading(false);
      if (viaCohort.success && viaCohort.file_url) {
        setViewUrl(viaCohort.file_url);
      } else {
        setViewError(viaCohort.error ?? "Something went wrong opening this report.");
      }
      return;
    }

    setViewLoading(false);
    setViewError(
      direct.status === 401
        ? direct.error ?? "Your session has expired. Please log in again."
        : "This report isn't linked to a cohort, so it can't be previewed here yet."
    );
  }

  async function handleDownloadSummary() {
    setDownloading(true);
    setDownloadError("");
    const result = await downloadImpactSummary();
    setDownloading(false);
    if (!result.success && result.error) {
      setDownloadError(result.error);
    }
  }

  return (
    <DonorLayout>
      <h1 className="text-2xl font-bold text-gray-900">Impact Reports</h1>
      <p className="text-sm text-gray-500 mt-1 mb-6">
        Select a report structure to view performance data and export official documentation.
      </p>

      <div className="grid lg:grid-cols-[1fr_1.6fr] gap-6 items-start">
        <div className="bg-white rounded-xl border border-black/5 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Available Reports</h2>

          {loadingReports ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : reportsError ? (
            <p role="alert" className="text-sm text-red-600">
              {reportsError}
            </p>
          ) : reports.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No reports have been uploaded yet.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {reports.map((r) => (
                <li
                  key={r.id}
                  className="border border-black/5 rounded-lg p-3 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(r.report_date).toLocaleDateString()}
                        {r.file_size ? ` · ${formatFileSize(r.file_size)}` : ""}
                        {r.file_type ? ` · ${r.file_type.toUpperCase()}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleView(r)}
                      aria-label={`View ${r.title}`}
                      className="text-teal-700 hover:text-teal-900 flex-shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-[#1A534A] rounded-xl p-6 text-white">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-white/10 px-2 py-0.5 rounded mb-3">
            Live Snapshot
          </span>
          <h2 className="text-lg font-semibold">Impact Summary</h2>
          <p className="text-sm text-white/70 mt-1 mb-6">
            A real-time snapshot of current program outcomes, cohort completion, and
            participant baseline data, generated fresh from live figures.
          </p>

          {downloadError && (
            <p role="alert" className="text-sm text-red-200 bg-red-900/30 rounded-lg px-3 py-2 mb-4">
              {downloadError}
            </p>
          )}

          <button
            type="button"
            onClick={handleDownloadSummary}
            disabled={downloading}
            className="flex items-center justify-center gap-2 bg-white text-[#1A534A] rounded-lg py-2.5 px-4 text-sm font-medium hover:bg-white/90 transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating report...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      <ReportViewerModal
        open={viewTarget !== null}
        title={viewTarget?.title ?? ""}
        fileUrl={viewUrl}
        fileType={viewTarget?.file_type}
        loading={viewLoading}
        error={viewError}
        onClose={() => setViewTarget(null)}
      />
    </DonorLayout>
  );
}
