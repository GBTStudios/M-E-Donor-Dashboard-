"use client";

import { useState } from "react";
import { User, Clock, Loader2, MessageSquare } from "lucide-react";
import {
  updateModerationStatus,
  addModeratorNote,
  fetchFlaggedDetail,
  FlaggedItem,
  FlaggedDetail,
  ModeratorNote,
} from "@/lib/qaAnalytics";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  false_positive: "bg-gray-200 text-gray-600",
  escalated: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  resolved: "Resolved",
  false_positive: "False Positive",
  escalated: "Escalated",
};

interface FlaggedConversationCardProps {
  item: FlaggedItem;
  onUpdated: () => void;
}

export default function FlaggedConversationCard({ item, onUpdated }: FlaggedConversationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState<ModeratorNote[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleExpand() {
    const next = !expanded;
    setExpanded(next);

    if (next && notes.length === 0) {
      setLoadingDetail(true);
      const result = await fetchFlaggedDetail(item.id);
      setLoadingDetail(false);
      if (result.success && result.detail) {
        setNotes(result.detail.moderator_notes);
      }
    }
  }

  async function handleStatusUpdate(status: "resolved" | "false_positive" | "escalated") {
    setError("");
    setUpdating(status);
    const result = await updateModerationStatus(item.id, status);
    setUpdating(null);

    if (result.success) {
      onUpdated();
      return;
    }
    setError(result.error ?? "Could not update this conversation.");
  }

  async function handleAddNote() {
    const text = newNote.trim();
    if (!text) return;

    setSubmittingNote(true);
    const result = await addModeratorNote(item.id, text);
    setSubmittingNote(false);

    if (result.success) {
      setNewNote("");
      const detailResult = await fetchFlaggedDetail(item.id);
      if (detailResult.success && detailResult.detail) {
        setNotes(detailResult.detail.moderator_notes);
      }
      return;
    }
    setError(result.error ?? "Could not add your note.");
  }

  return (
    <div className="bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Originating Identity
              </p>
              <p className="text-sm font-medium text-gray-800">{item.donor_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Clock className="w-3.5 h-3.5" />
              {new Date(item.created_at).toLocaleString()}
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[item.moderation_status]}`}
            >
              {STATUS_LABELS[item.moderation_status]}
            </span>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Inquiry</p>
          <p className="text-sm text-gray-800 italic">&ldquo;{item.question}&rdquo;</p>
        </div>

        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Response</p>
          <p className="text-sm text-gray-600">{item.response}</p>
        </div>

        <div className="mb-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Flag Reason</p>
          <p className="text-sm text-red-700 mt-0.5">{item.flag_reason}</p>
        </div>

        <button
          onClick={handleExpand}
          className="inline-flex items-center gap-1.5 text-sm text-teal-700 font-medium hover:underline"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {expanded ? "Hide moderation history" : "View full conversation context"}
        </button>

        {error && <p role="alert" className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      {expanded && (
        <div className="border-t border-black/5 bg-gray-50 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Moderator Notes
          </p>

          {loadingDetail ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </div>
          ) : notes.length === 0 ? (
            <p className="text-sm text-gray-400 mb-3">No notes yet.</p>
          ) : (
            <div className="space-y-2 mb-3">
              {notes.map((note) => (
                <div key={note.id} className="bg-white rounded-lg border border-black/5 px-3 py-2">
                  <p className="text-sm text-gray-700">{note.note}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {note.moderator_name} &middot; {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a moderation note..."
              className="flex-1 text-sm px-3 py-2 rounded-lg border border-black/10 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
            <button
              onClick={handleAddNote}
              disabled={submittingNote || !newNote.trim()}
              className="text-sm font-medium text-white bg-teal-800 hover:bg-teal-900 px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {submittingNote ? "Adding..." : "Add Note"}
            </button>
          </div>

          {item.moderation_status === "pending" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStatusUpdate("resolved")}
                disabled={updating !== null}
                className="text-sm font-medium text-white bg-teal-800 hover:bg-teal-900 px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {updating === "resolved" ? "Resolving..." : "Resolve"}
              </button>
              <button
                onClick={() => handleStatusUpdate("false_positive")}
                disabled={updating !== null}
                className="text-sm font-medium text-gray-700 border border-black/10 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                {updating === "false_positive" ? "Marking..." : "Mark as False Positive"}
              </button>
              <button
                onClick={() => handleStatusUpdate("escalated")}
                disabled={updating !== null}
                className="text-sm font-medium text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                {updating === "escalated" ? "Escalating..." : "Escalate"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
