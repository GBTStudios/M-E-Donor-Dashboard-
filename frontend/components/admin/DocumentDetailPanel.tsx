"use client";

import { X, FileText, User, Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { AuditDocument } from "@/lib/adminDocumentsAudit";
import { formatFileSize } from "@/lib/adminDocumentsAudit";
import type { DocumentStatus } from "@/lib/adminDocuments";

const STATUS_STYLES: Record<DocumentStatus, string> = {
  processing: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  published: "bg-green-100 text-green-700",
  excluded: "bg-gray-200 text-gray-500",
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  processing: "Processing",
  pending: "Pending",
  published: "Live",
  excluded: "Excluded",
};

interface DocumentDetailPanelProps {
  document: AuditDocument;
  onClose: () => void;
}

export default function DocumentDetailPanel({ document, onClose }: DocumentDetailPanelProps) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/10">
          <h2 className="text-lg font-semibold text-gray-800">Document Details</h2>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 break-words">
                {document.filename}
              </p>
              <p className="text-xs text-gray-400 mt-1">{document.display_id}</p>
            </div>
          </div>

          <div>
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[document.status]}`}
            >
              {STATUS_LABELS[document.status]}
            </span>
          </div>

          <dl className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <dt className="text-xs text-gray-400">Uploaded by</dt>
                <dd className="text-sm text-gray-700 mt-0.5">
                  {document.uploaded_by_name ?? "Unknown"}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <dt className="text-xs text-gray-400">File size</dt>
                <dd className="text-sm text-gray-700 mt-0.5">
                  {formatFileSize(document.file_size_bytes)}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <dt className="text-xs text-gray-400">Uploaded at</dt>
                <dd className="text-sm text-gray-700 mt-0.5">
                  {new Date(document.created_at).toLocaleString()}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <dt className="text-xs text-gray-400">Last updated</dt>
                <dd className="text-sm text-gray-700 mt-0.5">
                  {new Date(document.updated_at).toLocaleString()}
                </dd>
              </div>
            </div>

            {document.published_at && (
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <dt className="text-xs text-gray-400">Published at</dt>
                  <dd className="text-sm text-gray-700 mt-0.5">
                    {new Date(document.published_at).toLocaleString()}
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </div>

        {document.status === "pending" && (
          <div className="p-6 border-t border-black/10">
            <Link
              href={`/admin/knowledge-base?document=${document.id}`}
              className="block w-full text-center bg-teal-800 hover:bg-teal-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
            >
              Review in Knowledge Base →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
