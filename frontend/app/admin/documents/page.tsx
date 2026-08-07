"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import DocumentStatusTabs, { StatusTabValue } from "@/components/admin/DocumentStatusTabs";
import DocumentSearchBar from "@/components/admin/DocumentSearchBar";
import DocumentExportButton from "@/components/admin/DocumentExportButton";
import UploadedDocumentsTable from "@/components/admin/UploadedDocumentsTable";
import DocumentPagination from "@/components/admin/DocumentPagination";
import DocumentDetailPanel from "@/components/admin/DocumentDetailPanel";
import { fetchDocumentsAudit, AuditDocument } from "@/lib/adminDocumentsAudit";

const LIMIT = 20;

export default function UploadedDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<AuditDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<StatusTabValue>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<AuditDocument | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchDocumentsAudit({
      page,
      limit: LIMIT,
      search: search || undefined,
      status: status === "all" ? undefined : status,
    });

    if (result.success && result.documents) {
      setDocuments(result.documents);
      setTotal(result.total ?? 0);
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
  }, [page, search, status, router]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [status, search]);

  if (accessDenied) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <h1 className="text-lg font-semibold text-gray-800">Access denied</h1>
          <p className="text-sm text-gray-500 mt-1">
            You do not have admin access to view this page.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A534A]">Uploaded Documents</h1>
          <p className="text-sm text-[#5B7571] mt-1">
            Audit and manage the system knowledge base source files.
          </p>
        </div>
        <DocumentExportButton search={search} status={status} />
      </div>

      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <DocumentSearchBar value={search} onChange={setSearch} />
        <DocumentStatusTabs active={status} onChange={setStatus} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 mb-4">
          {error}
        </p>
      )}

      <UploadedDocumentsTable
        documents={documents}
        loading={loading}
        selectedId={selectedDoc?.id ?? null}
        onSelect={setSelectedDoc}
      />

      {!loading && total > 0 && (
        <DocumentPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
      )}

      {selectedDoc && (
        <DocumentDetailPanel document={selectedDoc} onClose={() => setSelectedDoc(null)} />
      )}
    </AdminLayout>
  );
}
