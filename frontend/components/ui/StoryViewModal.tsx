"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface StoryViewModalProps {
  open: boolean;
  name: string;
  title: string;
  body: string;
  imageUrl: string | null;
  onClose: () => void;
}

export default function StoryViewModal({
  open,
  name,
  title,
  body,
  imageUrl,
  onClose,
}: StoryViewModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-view-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-full overflow-y-auto"
      >
        <div className="relative aspect-[16/9] bg-gradient-to-br from-[#1A534A] to-[#2d7a6c] flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-5xl font-semibold">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-wide uppercase text-[#1A534A]/70">
            {title}
          </p>
          <h2 id="story-view-title" className="font-semibold text-gray-900 text-xl mt-1">
            {name}
          </h2>
          <p className="text-[15px] text-gray-600 mt-4 leading-relaxed whitespace-pre-line">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
