"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Trash2, FileText } from "lucide-react";
import {
  fetchDocumentDetail,
  saveDocumentEdit,
  publishDocument,
  excludeDocument,
  deleteDocument,
  DocumentDetail,
} from "@/lib/adminDocuments";

interface DocumentViewerProps {
  documentId: string;
  onChanged: () => void;
  onDeleted: () => void;
}

export default function DocumentViewer({ documentId, onChanged, onDeleted }: DocumentViewerProps) {
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [finalContent, setFinalContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [excluding, setExcluding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setAccessDenied(false);
    setError("");

    const result = await fetchDocumentDetail(documentId);

    if (result.success && result.document) {
      setDoc(result.document);
      setFinalContent(result.document.final_content ?? "");
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

    if (result.status === 404) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setError(result.error ?? "Something went wrong.");
    setLoading(false);
  }, [documentId, router]);

  useEffect(() => {
    load();
  }, [load]);

  // Still processing — poll until the AI summary is ready.
  useEffect(() => {
    if (doc?.status !== "processing") return;
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [doc?.status, load]);

  async function handleSave() {
    setActionError("");
    setSavedMessage("");
    setSaving(true);
    const result = await saveDocumentEdit(documentId, finalContent);
    setSaving(false);

    if (result.success && result.document) {
      setDoc(result.document);
      setSavedMessage("Saved.");
      onChanged();
      return;
    }

    if (result.status === 401) {
      router.replace("/login");
      return;
    }
    if (result.status === 403) {
      setAccessDenied(true);
      return;
    }
    setActionError(result.error ?? "Could not save your edit.");
  }

  async function handlePublish() {
    setActionError("");
    setPublishing(true);
    const result = await publishDocument(documentId);
    setPublishing(false);

    if (result.success && result.document) {
      setDoc(result.document);
      onChanged();
      return;
    }

    if (result.status === 401) {
      router.replace("/login");
      return;
    }
    if (result.status === 403) {
      setAccessDenied(true);
      return;
    }
    setActionError(result.error ?? "Could not publish this document.");
  }

  async function handleExclude() {
    const confirmed = window.confirm(
      "Exclude this document? It will no longer be eligible for publishing."
    );
    if (!confirmed) return;

    setActionError("");
    setExcluding(true);
    const result = await excludeDocument(documentId);
    setExcluding(false);

    if (result.success && result.document) {
      setDoc(result.document);
      onChanged();
      return;
    }

    if (result.status === 401) {
      router.replace("/login");
      return;
    }
    if (result.status === 403) {
      setAccessDenied(true);
      return;
    }
    setActionError(result.error ?? "Could not exclude this document.");
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Permanently delete this document and its file? This cannot be undone."
    );
    if (!confirmed) return;

    setActionError("");
    setDeleting(true);
    const result = await deleteDocument(documentId);
    setDeleting(false);

    if (result.success) {
      onDeleted();
      return;
    }

    if (result.status === 401) {
      router.replace("/login");
      return;
    }
    if (result.status === 403) {
      setAccessDenied(true);
      return;
    }
    setActionError(result.error ?? "Could not delete this document.");
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Access denied</h1>
          <p className="text-sm text-gray-500 mt-1">
            You do not have admin access to view this document.
          </p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Document not found</h1>
          <p className="text-sm text-gray-500 mt-1">This document may have been deleted.</p>
        </div>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex-1 flex items-center justify-center px-6">
        <p role="alert" className="text-sm text-red-600">
          {error || "Something went wrong."}
        </p>
      </div>
    );
  }

  if (doc.status === "processing") {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-6">
        <div>
          <Loader2 className="w-6 h-6 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">
            Extracting and summarizing this document...
          </p>
          <p className="text-xs text-gray-400 mt-1">This updates automatically once ready.</p>
        </div>
      </div>
    );
  }

  const canPublish = doc.status === "pending";
  const canExclude = doc.status === "pending";

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{doc.filename}</p>
            <p className="text-xs text-gray-400">
              {doc.status === "published" ? "Live and approved" : "Extracted knowledge payload"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={saving || doc.status !== "pending"}
            className="text-sm font-medium text-gray-700 border border-black/10 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Edit"}
          </button>

          {canPublish && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-teal-800 hover:bg-teal-900 px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {publishing ? "Publishing..." : "Approve & Publish"}
            </button>
          )}

          {canExclude && (
            <button
              onClick={handleExclude}
              disabled={excluding}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              {excluding ? "Excluding..." : "Exclude"}
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete document"
            className="p-2 rounded-lg border border-black/10 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {doc.status === "published" && (
        <div className="mx-6 mt-4 text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg px-3 py-2">
          This document is approved. Note: it does not yet feed the live chatbot automatically —
          that connection is a separate stage still being built.
        </div>
      )}

      {actionError && (
        <p role="alert" className="text-sm text-red-600 mx-6 mt-4">
          {actionError}
        </p>
      )}
      {savedMessage && (
        <p className="text-sm text-green-600 mx-6 mt-4">{savedMessage}</p>
      )}

      <div className="p-6">
        <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase mb-2">
          Extracted Knowledge Payload
        </p>
        <div className="bg-gray-50 border border-black/5 rounded-xl p-4 text-sm text-gray-600 whitespace-pre-wrap font-mono">
          {doc.ai_summary}
        </div>
      </div>

      <div className="px-6 pb-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
            Override / Refine Extracted Knowledge
          </p>
        </div>
        <textarea
          value={finalContent}
          onChange={(e) => setFinalContent(e.target.value)}
          disabled={doc.status !== "pending"}
          rows={12}
          className="flex-1 w-full rounded-xl border border-black/10 bg-white p-4 text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-teal-700 disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>
    </div>
  );
}
