"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, FileText, CheckCircle2, XCircle, Clock, AlertTriangle, Trash2 } from "lucide-react";
import { fetchImportHistory, deleteImport, ImportRecord } from "@/lib/adminParticipants";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  processing: { label: "Processing", className: "bg-blue-100 text-blue-700", icon: Loader2 },
  pending_review: { label: "Pending Review", className: "bg-amber-100 text-amber-700", icon: Clock },
  confirmed: { label: "Confirmed", className: "bg-green-100 text-green-700", icon: CheckCircle2 },
  rejected: { label: "Rejected", className: "bg-gray-200 text-gray-600", icon: XCircle },
  failed: { label: "Failed", className: "bg-red-100 text-red-700", icon: AlertTriangle },
};

interface ParticipantImportHistoryProps {
  refreshKey: number;
  onSelect: (id: string) => void;
}

export default function ParticipantImportHistory({ refreshKey, onSelect }: ParticipantImportHistoryProps) {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ImportRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const result = await fetchImportHistory();
    if (result.success && result.imports) {
      setImports(result.imports);
    } else {
      setError(result.error ?? "");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  function handleDeleteClick(e: React.MouseEvent, imp: ImportRecord) {
    e.stopPropagation(); // don't also trigger the row's onSelect
    setError("");
    setPendingDelete(imp);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    const isConfirmed = pendingDelete.status === "confirmed";
    const result = await deleteImport(pendingDelete.id, isConfirmed);
    setDeleting(false);

    if (result.success) {
      setImports((prev) => prev.filter((i) => i.id !== pendingDelete.id));
      setSuccessMessage(result.message ?? "Import deleted.");
      setTimeout(() => setSuccessMessage(""), 5000);
      setPendingDelete(null);
      return;
    }

    setError(result.error ?? "Could not delete this import.");
    setPendingDelete(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (imports.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4">No imports yet. Upload a file above to get started.</p>
    );
  }

  return (
    <div>
      {successMessage && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 mb-3">
          {successMessage}
        </p>
      )}
      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-black/5 bg-gray-50">
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">File</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Rows</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Uploaded</th>
              <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {imports.map((imp) => {
              const config = STATUS_CONFIG[imp.status] ?? STATUS_CONFIG.processing;
              const Icon = config.icon;

              return (
                <tr
                  key={imp.id}
                  onClick={() => onSelect(imp.id)}
                  className="border-b border-black/5 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-800 truncate">{imp.filename}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{imp.row_count ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${config.className}`}>
                      <Icon className={`w-3 h-3 ${imp.status === "processing" ? "animate-spin" : ""}`} />
                      {config.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(imp.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => handleDeleteClick(e, imp)}
                      aria-label={`Delete ${imp.filename}`}
                      title="Delete this import"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pendingDelete && pendingDelete.status === "confirmed" && (
        <ConfirmDeleteModal
          title="Delete a confirmed import?"
          description={`"${pendingDelete.filename}" is confirmed and its ${pendingDelete.row_count ?? "—"} participant record(s) are live on the donor dashboard right now. Deleting it will permanently remove this import AND all of those participant records from the dataset. This affects public-facing numbers immediately and cannot be undone.`}
          requireTypedConfirmation
          confirmWord="DELETE"
          confirmLabel="Delete import and records"
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {pendingDelete && pendingDelete.status !== "confirmed" && (
        <ConfirmDeleteModal
          title="Delete this import?"
          description={`"${pendingDelete.filename}" will be permanently removed. This does not affect any live participant data, since this import was never confirmed.`}
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}