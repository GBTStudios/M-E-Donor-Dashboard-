"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ParticipantImportUpload from "@/components/admin/ParticipantImportUpload";
import ParticipantImportReview from "@/components/admin/ParticipantImportReview";
import ParticipantImportHistory from "@/components/admin/ParticipantImportHistory";
import ParticipantImportDetailModal from "@/components/admin/ParticipantImportDetailModal";

export default function ParticipantImportPage() {
  const [importId, setImportId] = useState<string | null>(null);
  const [viewingImportId, setViewingImportId] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");

  function handleUploaded(id: string) {
    setImportId(id);
    setSuccessMessage("");
    setHistoryKey((k) => k + 1);
  }

  function handleResolved(message: string) {
    setImportId(null);
    setSuccessMessage(message);
    setHistoryKey((k) => k + 1);
    setTimeout(() => setSuccessMessage(""), 5000);
  }

  function handleModalResolved() {
    setSuccessMessage("Import updated.");
    setHistoryKey((k) => k + 1);
    setTimeout(() => setSuccessMessage(""), 5000);
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-[#1A534A]">Import Participant Data</h1>
      <p className="text-sm text-[#5B7571] mt-1 mb-6">
        Upload M&amp;E participant records to power the Donor Dashboard&apos;s baseline stats and origin map.
      </p>

      {successMessage && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {!importId ? (
        <div className="max-w-xl mb-8">
          <ParticipantImportUpload onUploaded={handleUploaded} />
        </div>
      ) : (
        <div className="mb-8">
          <ParticipantImportReview
            importId={importId}
            onResolved={() => handleResolved("Import confirmed and added to participant data.")}
          />
          <button
            onClick={() => setImportId(null)}
            className="text-sm text-teal-700 font-medium hover:underline mt-4"
          >
            ← Upload another file
          </button>
        </div>
      )}

      <h2 className="text-base font-semibold text-gray-800 mb-3">Import History</h2>
      <p className="text-xs text-gray-400 mb-3">
        Click any row to view its data. Files still pending review can be confirmed or rejected from there.
      </p>
      <ParticipantImportHistory refreshKey={historyKey} onSelect={setViewingImportId} />

      {viewingImportId && (
        <ParticipantImportDetailModal
          importId={viewingImportId}
          onClose={() => setViewingImportId(null)}
          onResolved={handleModalResolved}
        />
      )}
    </AdminLayout>
  );
}