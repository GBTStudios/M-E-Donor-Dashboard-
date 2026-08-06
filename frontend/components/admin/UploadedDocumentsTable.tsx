"use client";

import { FileText, User } from "lucide-react";
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

interface UploadedDocumentsTableProps {
  documents: AuditDocument[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (doc: AuditDocument) => void;
}

export default function UploadedDocumentsTable({
  documents,
  loading,
  selectedId,
  onSelect,
}: UploadedDocumentsTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-black/5 p-10 text-center text-sm text-gray-400">
        Loading documents...
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-black/5 p-10 text-center text-sm text-gray-400">
        No documents match this filter.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[640px]">
          <thead>
            <tr className="border-b border-black/5 bg-gray-50">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Document
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Upload Date
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Uploaded By
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr
                key={doc.id}
                onClick={() => onSelect(doc)}
                className={`border-b border-black/5 last:border-0 cursor-pointer transition-colors ${
                  selectedId === doc.id ? "bg-teal-50" : "hover:bg-gray-50"
                }`}
              >
                <td className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{doc.filename}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {doc.display_id} &middot; {formatFileSize(doc.file_size_bytes)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap">
                  {new Date(doc.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-600 whitespace-nowrap">
                      {doc.uploaded_by_name ?? "Unknown"}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[doc.status]}`}
                  >
                    {STATUS_LABELS[doc.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
