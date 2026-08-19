"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, X, AlertCircle, ExternalLink, FileWarning } from "lucide-react";

interface ReportViewerModalProps {
  open: boolean;
  title: string;
  fileUrl: string | null;
  fileType?: string;
  loading: boolean;
  error: string;
  onClose: () => void;
}

const PREVIEWABLE_TYPES = ["pdf"];

export default function ReportViewerModal({
  open,
  title,
  fileUrl,
  fileType,
  loading,
  error,
  onClose,
}: ReportViewerModalProps) {
  const { t } = useTranslation("donor");

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const normalizedType = fileType?.toLowerCase().replace(".", "");
  const canPreview = normalizedType ? PREVIEWABLE_TYPES.includes(normalizedType) : true;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-viewer-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl h-full flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-black/5 flex-shrink-0">
          <h2 id="report-viewer-title" className="text-sm font-semibold text-gray-800 truncate">
            {title}
          </h2>
          <div className="flex items-center gap-1 flex-shrink-0">
            {fileUrl && (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" aria-label={t("shared.reportViewer.openInNewTab")} className="text-gray-400 hover:text-teal-700 p-1.5 rounded-lg hover:bg-gray-50 transition">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t("shared.reportViewer.close")}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-gray-100 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : fileUrl && canPreview ? (
            <iframe src={fileUrl} title={title} className="w-full h-full border-0" />
          ) : fileUrl && !canPreview ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
              <FileWarning className="w-8 h-8 text-gray-300" />
              <div>
                <p className="text-sm text-gray-600">
                  {t("shared.reportViewer.noPreview")}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t("shared.reportViewer.needsDownload", {
                    type: normalizedType ? normalizedType.toUpperCase() : t("shared.reportViewer.thisFile"),
                  })}
                </p>
              </div>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-900 text-white rounded-lg py-2 px-4 text-sm font-medium transition">
                <ExternalLink className="w-3.5 h-3.5" />
                {t("shared.reportViewer.downloadToView")}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}