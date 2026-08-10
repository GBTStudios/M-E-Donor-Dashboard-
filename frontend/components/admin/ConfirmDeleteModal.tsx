"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDeleteModalProps {
  title: string;
  description: string;
  requireTypedConfirmation?: boolean;
  confirmWord?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDeleteModal({
  title,
  description,
  requireTypedConfirmation = false,
  confirmWord = "DELETE",
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDeleteModalProps) {
  const [typed, setTyped] = useState("");
  const canConfirm = !requireTypedConfirmation || typed === confirmWord;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <button
          onClick={onCancel}
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
        </div>

        {requireTypedConfirmation && (
          <div className="mt-4">
            <label className="text-xs font-medium text-gray-600">
              Type <span className="font-mono font-semibold text-gray-800">{confirmWord}</span> to confirm
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="w-full mt-1.5 px-3 py-2 text-sm rounded-lg border border-black/10 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              autoFocus
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="text-sm font-medium text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || loading}
            className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}