"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, FileText, AlertTriangle } from "lucide-react";
import {
  fetchImportDetail,
  confirmImport,
  rejectImport,
  ImportRecord,
} from "@/lib/adminParticipants";

interface ParticipantImportReviewProps {
  importId: string;
  onResolved: () => void;
}

const STATUS_BANNER: Record<string, { text: string; className: string }> = {
  confirmed: {
    text: "This import was confirmed. These rows are saved in participant data.",
    className: "bg-green-50 border-green-200 text-green-700",
  },
  rejected: {
    text: "This import was rejected. No rows from this file were saved.",
    className: "bg-gray-50 border-black/10 text-gray-600",
  },
};

export default function ParticipantImportReview({ importId, onResolved }: ParticipantImportReviewProps) {
  const router = useRouter();
  const [record, setRecord] = useState<ImportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchImportDetail(importId);

    if (result.success && result.import) {
      setRecord(result.import);
      setLoading(false);
      return;
    }

    if (result.status === 401) {
      router.replace("/login");
      return;
    }

    setError(result.error ?? "Something went wrong.");
    setLoading(false);
  }, [importId, router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (record?.status !== "processing") return;
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [record?.status, load]);

  async function handleConfirm() {
    setError("");
    setConfirming(true);
    const result = await confirmImport(importId);
    setConfirming(false);

    if (result.success) {
      onResolved();
      return;
    }
    setError(result.error ?? "Could not confirm this import.");
  }

  async function handleReject() {
    const ok = window.confirm("Reject this import? None of the parsed rows will be saved.");
    if (!ok) return;

    setError("");
    setRejecting(true);
    const result = await rejectImport(importId);
    setRejecting(false);

    if (result.success) {
      onResolved();
      return;
    }
    setError(result.error ?? "Could not reject this import.");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!record) {
    return <p role="alert" className="text-sm text-red-600">{error || "Something went wrong."}</p>;
  }

  if (record.status === "processing") {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600">Parsing {record.filename}...</p>
        <p className="text-xs text-gray-400 mt-1">This updates automatically once ready.</p>
      </div>
    );
  }

  if (record.status === "failed") {
    return (
      <div className="bg-red-50 border border-red-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-red-700">Parsing failed</p>
        </div>
        <p className="text-sm text-red-600 mt-1">
          {record.preview_data?.error ?? "Something went wrong while parsing this file."}
        </p>
      </div>
    );
  }

  const isPending = record.status === "pending_review";
  const columns = record.preview_data?.columns ?? [];
  const sampleRows = record.preview_data?.sample_rows ?? [];
  const banner = STATUS_BANNER[record.status];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{record.filename}</p>
            <p className="text-xs text-gray-400">{record.row_count ?? 0} rows detected</p>
          </div>
        </div>

        {isPending && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleConfirm}
              disabled={confirming || rejecting}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-teal-800 hover:bg-teal-900 px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {confirming ? "Confirming..." : "Confirm Import"}
            </button>
            <button
              onClick={handleReject}
              disabled={confirming || rejecting}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              {rejecting ? "Rejecting..." : "Reject"}
            </button>
          </div>
        )}
      </div>

      {banner && (
        <div className={`text-sm rounded-lg px-4 py-3 mb-4 border ${banner.className}`}>
          {banner.text}
        </div>
      )}

      {isPending && (record.row_count ?? 0) > sampleRows.length && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
          Showing a preview of the first {sampleRows.length} of {record.row_count} rows.
        </p>
      )}

      {error && <p role="alert" className="text-sm text-red-600 mb-4">{error}</p>}

      {columns.length > 0 && sampleRows.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-xl border border-black/5">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-black/5 bg-gray-50">
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 whitespace-nowrap">
                    {col.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleRows.map((row, i) => (
                <tr key={i} className="border-b border-black/5 last:border-0">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2.5 text-sm text-gray-700 whitespace-nowrap">
                      {row[col] === null || row[col] === undefined ? "—" : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 py-4">No preview data available for this import.</p>
      )}
    </div>
  );
}