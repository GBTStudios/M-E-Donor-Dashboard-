"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import DocumentUpload from "@/components/admin/DocumentUpload";
import { fetchDocuments, DocumentListItem, DocumentStatus } from "@/lib/adminDocuments";

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

const PAGE_SIZE = 5;

interface DocumentRegistryProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function DocumentRegistry({ selectedId, onSelect }: DocumentRegistryProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [page, setPage] = useState(0);

  const loadDocuments = useCallback(async () => {
    const result = await fetchDocuments();

    if (result.success && result.documents) {
      setDocuments(result.documents);
      setLoading(false);
      return;
    }

    if (result.status === 401) {
      router.replace("/login");
      return;
    }

    if (result.status === 403) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    setError(result.error ?? "Something went wrong.");
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Documents in "processing" status will finish in the background — poll
  // periodically so they move to "pending" without the admin needing to
  // manually refresh the page.
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === "processing");
    if (!hasProcessing) return;

    const interval = setInterval(loadDocuments, 5000);
    return () => clearInterval(interval);
  }, [documents, loadDocuments]);

  const filtered = documents.filter((d) =>
    d.filename.toLowerCase().includes(filterText.toLowerCase())
  );

  // Reset to page 0 whenever the filter text changes, so the user doesn't
  // land on an empty page after narrowing the results.
  useEffect(() => {
    setPage(0);
  }, [filterText]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  if (accessDenied) {
    return (
      <div className="text-center py-16">
        <h1 className="text-lg font-semibold text-gray-800">Access denied</h1>
        <p className="text-sm text-gray-500 mt-1">
          You do not have admin access to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="w-80 flex-shrink-0 border-r border-black/10 h-full flex flex-col">
      <div className="p-5 border-b border-black/10">
        <h1 className="text-lg font-semibold text-gray-800 mb-4">Document Registry</h1>
        <DocumentUpload onUploaded={loadDocuments} />
      </div>

      <div className="px-5 py-3 border-b border-black/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter registry..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-black/10 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <p role="alert" className="text-sm text-red-600 p-5">
            {error}
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">No documents found.</p>
        ) : (
          <ul>
            {visible.map((doc) => (
              <li key={doc.id}>
                <button
                  onClick={() => onSelect(doc.id)}
                  className={`w-full text-left px-5 py-3 border-b border-black/5 hover:bg-gray-50 transition ${
                    selectedId === doc.id ? "bg-teal-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {doc.filename}
                        </p>
                        <span
                          className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[doc.status]}`}
                        >
                          {STATUS_LABELS[doc.status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!loading && !error && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-black/10 flex-shrink-0">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="flex items-center gap-1 text-sm font-medium text-teal-700 disabled:text-gray-300 hover:text-teal-800 disabled:hover:text-gray-300 transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <span className="text-xs text-gray-400">
            Page {currentPage + 1} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="flex items-center gap-1 text-sm font-medium text-teal-700 disabled:text-gray-300 hover:text-teal-800 disabled:hover:text-gray-300 transition"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
