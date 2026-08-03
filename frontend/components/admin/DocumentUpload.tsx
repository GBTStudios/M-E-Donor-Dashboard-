"use client";

import { useState, useRef, DragEvent } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { uploadDocument } from "@/lib/adminDocuments";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
];

const MAX_SIZE = 25 * 1024 * 1024;

interface DocumentUploadProps {
  onUploaded: () => void;
}

export default function DocumentUpload({ onUploaded }: DocumentUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  function validateFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Please upload a PDF, Word, Excel, or CSV file.";
    }
    if (file.size > MAX_SIZE) {
      return "File must be under 25MB.";
    }
    return null;
  }

  async function handleFile(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");
    setUploading(true);
    const result = await uploadDocument(file);
    setUploading(false);

    if (result.success) {
      onUploaded();
      return;
    }

    setError(result.error ?? "Something went wrong uploading the file.");
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleBrowse(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? "border-teal-700 bg-teal-50" : "border-black/15 bg-white"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <Loader2 className="w-6 h-6 animate-spin text-teal-700" />
            <p className="text-sm text-gray-500">Uploading...</p>
          </div>
        ) : (
          <>
            <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700">Click or drag to upload</p>
            <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, or CSV (Max 25MB)</p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-4 inline-flex items-center gap-2 bg-white border border-black/10 text-sm font-medium text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Browse Files
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.csv"
              onChange={handleBrowse}
              className="hidden"
            />
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}
