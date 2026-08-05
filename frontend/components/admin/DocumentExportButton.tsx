"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { getExportUrl } from "@/lib/adminDocumentsAudit";
import { getAuthHeaders } from "@/lib/auth";
import type { StatusTabValue } from "@/components/admin/DocumentStatusTabs";

interface DocumentExportButtonProps {
  search: string;
  status: StatusTabValue;
}

export default function DocumentExportButton({ search, status }: DocumentExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  async function handleExport() {
    setError("");
    setExporting(true);

    try {
      const url = getExportUrl({
        search: search || undefined,
        status: status === "all" ? undefined : status,
      });

      const response = await fetch(url, { headers: { ...getAuthHeaders() } });

      if (!response.ok) {
        setError("Could not generate the export. Please try again.");
        setExporting(false);
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `groundbreaker-documents-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="inline-flex items-center gap-2 bg-white border border-black/10 text-sm font-medium text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
      >
        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {exporting ? "Exporting..." : "Export Data"}
      </button>
      {error && <p role="alert" className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
