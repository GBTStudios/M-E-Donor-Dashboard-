"use client";

import { X } from "lucide-react";
import ParticipantImportReview from "@/components/admin/ParticipantImportReview";

interface ParticipantImportDetailModalProps {
  importId: string;
  onClose: () => void;
  onResolved: () => void;
}

export default function ParticipantImportDetailModal({
  importId,
  onClose,
  onResolved,
}: ParticipantImportDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <ParticipantImportReview
          importId={importId}
          onResolved={() => {
            onResolved();
            onClose();
          }}
        />
      </div>
    </div>
  );
}