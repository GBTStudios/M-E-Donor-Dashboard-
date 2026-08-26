"use client";

import { useState, useEffect, FormEvent } from "react";
import { Loader2, Trash2, CheckCircle2, UploadCloud, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ReportViewerModal from "@/components/ui/ReportViewerModal";
import {
  fetchAdminReports,
  fetchCohortOptions,
  fetchReportUrl,
  fetchCohortReportUrl,
  uploadReport,
  deleteReport,
  type ReportScope,
  ReportListItem,
  CohortOption,
} from "@/lib/adminReports";

const REPORTS_PAGE_SIZE = 4;

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [cohorts, setCohorts] = useState<CohortOption[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [listError, setListError] = useState("");
  const [reportPage, setReportPage] = useState(1);

  const [title, setTitle] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [reportScope, setReportScope] = useState<ReportScope>("single_cohort");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<ReportListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [viewTarget, setViewTarget] = useState<ReportListItem | null>(null);
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState("");

  async function loadReports() {
    const result = await fetchAdminReports();
    if (result.success && result.reports) {
      setReports(result.reports);
      setListError("");
    } else if (result.error) {
      setListError(result.error);
    }
    setLoadingReports(false);
  }

  useEffect(() => {
    loadReports();
    fetchCohortOptions().then((result) => {
      if (result.success && result.cohorts) setCohorts(result.cohorts);
    });
  }, []);

  const totalReportPages = Math.ceil(reports.length / REPORTS_PAGE_SIZE);
  const paginatedReports = reports.slice(
    (reportPage - 1) * REPORTS_PAGE_SIZE,
    reportPage * REPORTS_PAGE_SIZE
  );

  const formValid = title.trim().length > 0 && reportDate.length > 0 && file !== null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formValid || !file) return;

    setUploading(true);
    setUploadError("");
    setSuccessMessage("");

    const result = await uploadReport(
      title.trim(),
      reportDate,
      reportScope === "single_cohort" ? (cohortId || null) : null,
      file,
      reportScope
    );
    setUploading(false);

    if (result.success) {
      const msg = reportScope === "multi_cohort"
        ? "Multi-cohort report uploaded successfully. Cohort data will populate shortly — this may take 20-30 seconds."
        : "Report uploaded successfully. Cohort data will populate shortly — this may take a few seconds.";
      setSuccessMessage(msg);
      setTitle("");
      setReportDate("");
      setCohortId("");
      setReportScope("single_cohort");
      setFile(null);
      const fileInput = document.getElementById("report-file") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      setReportPage(1);
      loadReports();
      setTimeout(() => setSuccessMessage(""), 7000);
    } else if (result.error) {
      setUploadError(result.error);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteReport(deleteTarget.id);
    setDeleting(false);
    if (result.success) {
      setReports((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
      setReportPage(1);
    } else if (result.error) {
      setListError(result.error);
      setDeleteTarget(null);
    }
  }

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

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-[#1A534A]">Reports</h1>
      <p className="text-sm text-[#5B7571] mt-1 mb-6">
        Upload official M&amp;E reports for donors to view, and optionally link them to a cohort.
      </p>

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6 items-start">
        {/* Upload form */}
        <div className="bg-white rounded-xl border border-black/5 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Upload Report</h2>

          {successMessage && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2 mb-4">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {successMessage}
            </div>
          )}

          {uploadError && (
            <p role="alert" className="text-sm text-red-600 mb-4">{uploadError}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Report Type */}
            <div>
              <label htmlFor="report-scope" className="text-sm font-medium text-gray-700">
                Report Type
              </label>
              <select
                id="report-scope"
                value={reportScope}
                onChange={(e) => {
                  setReportScope(e.target.value as ReportScope);
                  setCohortId("");
                }}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-black/10 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                <option value="single_cohort">Single Cohort</option>
                <option value="multi_cohort">Multi-Cohort</option>
              </select>
              {reportScope === "multi_cohort" && (
                <p className="text-xs text-gray-400 mt-1">
                  This report covers multiple cohorts. The system will automatically extract and update each cohort&apos;s data.
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label htmlFor="report-title" className="text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                id="report-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Cohort Deep-Dive"
                className="w-full mt-1 px-3 py-2 rounded-lg border border-black/10 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            {/* Report Date */}
            <div>
              <label htmlFor="report-date" className="text-sm font-medium text-gray-700">
                Report Date
              </label>
              <input
                id="report-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-black/10 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            {/* Cohort picker — only for single cohort */}
            {reportScope === "single_cohort" && (
              <div>
                <label htmlFor="report-cohort" className="text-sm font-medium text-gray-700">
                  Cohort <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  id="report-cohort"
                  value={cohortId}
                  onChange={(e) => setCohortId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-black/10 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <option value="">Not linked to a cohort</option>
                  {cohorts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* File */}
            <div>
              <label htmlFor="report-file" className="text-sm font-medium text-gray-700">
                File
              </label>
              <input
                id="report-file"
                type="file"
                accept=".pdf,.docx,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null;
                  setFile(selected);
                  if (selected && !title.trim()) {
                    setTitle(selected.name.replace(/\.(pdf|docx|xlsx)$/i, ""));
                  }
                }}
                className="w-full mt-1 text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:text-sm file:font-medium hover:file:bg-teal-100"
              />
              <p className="text-xs text-gray-400 mt-1">PDF, Word, or Excel — up to 45MB.</p>
            </div>

            <button
              type="submit"
              disabled={!formValid || uploading}
              className="w-full flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Upload Report
                </>
              )}
            </button>
          </form>
        </div>

        {/* Uploaded reports list */}
        <div className="bg-white rounded-xl border border-black/5 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Uploaded Reports</h2>

          {loadingReports ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : listError ? (
            <p role="alert" className="text-sm text-red-600">{listError}</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No reports uploaded yet.</p>
          ) : (
            <>
              <ul className="space-y-2">
                {paginatedReports.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2 border border-black/5 rounded-lg p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(r.report_date).toLocaleDateString()}
                        {r.file_size ? ` · ${formatFileSize(r.file_size)}` : ""}
                        {r.file_type ? ` · ${r.file_type.toUpperCase()}` : ""}
                        {r.cohort_id ? " · Single cohort" : " · Multi-cohort"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleView(r)}
                        aria-label={`View ${r.title}`}
                        className="text-gray-400 hover:text-teal-700 p-1.5 rounded-lg hover:bg-gray-50 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(r)}
                        aria-label={`Delete ${r.title}`}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-gray-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              {totalReportPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-black/5">
                  <p className="text-xs text-gray-400">
                    {(reportPage - 1) * REPORTS_PAGE_SIZE + 1}–{Math.min(reportPage * REPORTS_PAGE_SIZE, reports.length)} of {reports.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                      disabled={reportPage === 1}
                      className="flex items-center gap-1 text-sm font-medium text-[#1A534A] disabled:opacity-30 hover:bg-[#eaf5f0] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <span className="text-xs text-gray-400">{reportPage} / {totalReportPages}</span>
                    <button
                      type="button"
                      onClick={() => setReportPage((p) => Math.min(totalReportPages, p + 1))}
                      disabled={reportPage === totalReportPages}
                      className="flex items-center gap-1 text-sm font-medium text-[#1A534A] disabled:opacity-30 hover:bg-[#eaf5f0] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete this report?"
        message={deleteTarget ? `"${deleteTarget.title}" will be permanently removed. This can't be undone.` : ""}
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ReportViewerModal
        open={viewTarget !== null}
        title={viewTarget?.title ?? ""}
        fileUrl={viewUrl}
        fileType={viewTarget?.file_type}
        loading={viewLoading}
        error={viewError}
        onClose={() => setViewTarget(null)}
      />
    </AdminLayout>
  );
}
