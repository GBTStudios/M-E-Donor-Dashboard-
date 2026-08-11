"use client";

import { useState, useEffect, FormEvent } from "react";
import { Loader2, Trash2, CheckCircle2, UploadCloud } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  fetchAdminReports,
  fetchCohortOptions,
  uploadReport,
  deleteReport,
  ReportListItem,
  CohortOption,
} from "@/lib/adminReports";

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

  const [title, setTitle] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const formValid = title.trim().length > 0 && reportDate.length > 0 && file !== null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formValid || !file) return;

    setUploading(true);
    setUploadError("");
    setSuccessMessage("");

    const result = await uploadReport(title.trim(), reportDate, cohortId || null, file);
    setUploading(false);

    if (result.success) {
      setSuccessMessage("Report uploaded successfully.");
      setTitle("");
      setReportDate("");
      setCohortId("");
      setFile(null);
      const fileInput = document.getElementById("report-file") as HTMLInputElement | null;
      if (fileInput) fileInput.value = "";
      loadReports();
      setTimeout(() => setSuccessMessage(""), 4000);
    } else if (result.error) {
      setUploadError(result.error);
    }
  }

  async function handleDelete(reportId: string) {
    setDeletingId(reportId);
    const result = await deleteReport(reportId);
    setDeletingId(null);
    if (result.success) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } else if (result.error) {
      setListError(result.error);
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-[#1A534A]">Reports</h1>
      <p className="text-sm text-[#5B7571] mt-1 mb-6">
        Upload official M&amp;E reports for donors to view, and optionally link them to a cohort.
      </p>

      <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6 items-start">
        <div className="bg-white rounded-xl border border-black/5 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Upload Report</h2>

          {successMessage && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2 mb-4">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {successMessage}
            </div>
          )}

          {uploadError && (
            <p role="alert" className="text-sm text-red-600 mb-4">
              {uploadError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="report-file" className="text-sm font-medium text-gray-700">
                PDF File
              </label>
              <input
                id="report-file"
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null;
                  setFile(selected);
                  if (selected && !title.trim()) {
                    setTitle(selected.name.replace(/\.pdf$/i, ""));
                  }
                }}
                className="w-full mt-1 text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:text-sm file:font-medium hover:file:bg-teal-100"
              />
              <p className="text-xs text-gray-400 mt-1">PDF only, up to 25MB.</p>
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

        <div className="bg-white rounded-xl border border-black/5 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Uploaded Reports</h2>

          {loadingReports ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : listError ? (
            <p role="alert" className="text-sm text-red-600">
              {listError}
            </p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">No reports uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {reports.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 border border-black/5 rounded-lg p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(r.report_date).toLocaleDateString()}
                      {r.file_size ? ` · ${formatFileSize(r.file_size)}` : ""}
                      {r.cohort_id ? " · Linked to cohort" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    disabled={deletingId === r.id}
                    aria-label={`Delete ${r.title}`}
                    className="text-gray-400 hover:text-red-600 flex-shrink-0 disabled:opacity-50"
                  >
                    {deletingId === r.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
