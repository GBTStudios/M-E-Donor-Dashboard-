"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Trash2, FileText, Sparkles, ShieldAlert, Eye, Pencil } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
  const [mode, setMode] = useState<"view" | "edit">("view");

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setAccessDenied(false);
    setError("");

    const result = await fetchDocumentDetail(documentId);

    if (result.success && result.document) {
      setDoc(result.document);
      setFinalContent(result.document.final_content ?? "");
      setMode("view");
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
      setMode("view");
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

  const canEdit = doc.status === "pending";
  const canPublish = doc.status === "pending";
  const canExclude = doc.status === "pending";
  const isEditing = mode === "edit" && canEdit;

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
          {canEdit && (
            <button
              onClick={() => setMode("view")}
              aria-label="View"
              className={`p-2 rounded-lg border transition ${
                mode === "view"
                  ? "border-teal-700 bg-teal-50 text-teal-800"
                  : "border-black/10 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          {canEdit && (
            <button
              onClick={() => setMode("edit")}
              aria-label="Edit"
              className={`p-2 rounded-lg border transition ${
                mode === "edit"
                  ? "border-teal-700 bg-teal-50 text-teal-800"
                  : "border-black/10 text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}

          {isEditing && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm font-medium text-gray-700 border border-black/10 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Edit"}
            </button>
          )}

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
            aria-label="Remove"
            className="p-2 rounded-lg border border-black/10 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {canPublish && (
        <div className="mx-6 mt-4 flex items-start gap-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-2.5">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Publishing syncs this content to the live chatbot</strong> — nothing reaches donors before this step. Review carefully before approving.
          </span>
        </div>
      )}

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
        <div className="bg-gray-50 border border-black/5 rounded-xl p-5 text-sm text-gray-700 prose prose-sm max-w-none prose-headings:text-[#1A534A] prose-headings:font-semibold prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2 prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1.5 prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:my-2 prose-li:my-0.5 prose-p:my-2 prose-table:text-xs">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {doc.ai_summary}
          </ReactMarkdown>
        </div>
      </div>

      <div className="px-6 pb-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
            Override / Refine Extracted Knowledge
          </p>
          {canEdit && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              AI Suggester Active
            </span>
          )}
        </div>

        {isEditing ? (
          <textarea
            value={finalContent}
            onChange={(e) => setFinalContent(e.target.value)}
            rows={12}
            className="flex-1 w-full rounded-xl border border-black/10 bg-white p-4 text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        ) : (
          <div className="flex-1 w-full rounded-xl border border-black/10 bg-white p-5 text-sm text-gray-700 prose prose-sm max-w-none prose-headings:text-[#1A534A] prose-headings:font-semibold prose-h2:text-base prose-h2:mt-4 prose-h2:mb-2 prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1.5 prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:my-2 prose-li:my-0.5 prose-p:my-2 prose-table:text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {finalContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
