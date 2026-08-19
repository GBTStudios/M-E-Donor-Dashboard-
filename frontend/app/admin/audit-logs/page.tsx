"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, SlidersHorizontal, Download, ChevronDown, ChevronUp,
  User, Calendar, X, Loader2, AlertTriangle, CheckCircle2, ArrowRight,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  getAuditLogs, getConversationContext, resolveAuditLog, exportAuditLogsPdf,
  type AuditLogItem, type AuditStatus, type ConversationContext,
} from "@/lib/adminChatAudit";

const ACCESS_TOKEN_KEY = "access_token";
const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).replace(",", "");
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ status, resolved }: { status: string; resolved: boolean }) {
  if (status === "answered") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full">
        Answered
      </span>
    );
  }
  if (status === "declined") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2.5 py-1 rounded-full">
        Declined
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${
      resolved
        ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
        : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
    }`}>
      {resolved ? "Resolved" : "Flagged"}
    </span>
  );
}

// ── Conversation context modal ────────────────────────────────────────────────

function ContextModal({
  context,
  onClose,
}: {
  context: ConversationContext;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-[#1a2e2b] rounded-2xl border border-black/10 dark:border-white/10 shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/10">
          <div>
            <h2 className="text-base font-semibold text-[#1A534A] dark:text-[#7dd3c0]">
              Full Conversation Context
            </h2>
            <p className="text-xs text-[#5B7571] dark:text-[#8fada9] mt-0.5">
              {context.originatingIdentity}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#7C9791] hover:text-[#1A534A] dark:hover:text-[#7dd3c0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4 flex flex-col gap-5">
          {context.messages.map((msg, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="bg-[#eaf5f0] dark:bg-[#243f3b] rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791] dark:text-[#5a9e94] mb-1">
                  Inquiry
                </p>
                <p className="text-sm text-[#1A534A] dark:text-[#7dd3c0]">{msg.inquiry}</p>
              </div>
              <div className="bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791] dark:text-[#5a9e94] mb-1">
                  Response
                </p>
                <p className="text-sm text-[#5B7571] dark:text-[#8fada9]">{msg.response}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={msg.status} resolved={false} />
                <span className="text-xs text-[#7C9791] dark:text-[#5a9e94]">{formatTs(msg.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Log row ───────────────────────────────────────────────────────────────────

function LogRow({
  item,
  onResolve,
  onViewContext,
}: {
  item: AuditLogItem;
  onResolve: (id: string) => void;
  onViewContext: (conversationId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white dark:bg-[#1a2e2b] rounded-2xl border border-black/10 dark:border-white/10 shadow-sm overflow-hidden">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-2 text-xs text-[#5B7571] dark:text-[#8fada9]">
          <User className="w-3.5 h-3.5 text-[#7C9791] dark:text-[#5a9e94]" />
          <span className="font-semibold">{item.originatingIdentity}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#5B7571] dark:text-[#8fada9]">
          <Calendar className="w-3.5 h-3.5 text-[#7C9791] dark:text-[#5a9e94]" />
          <span>{formatTs(item.createdAt)}</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <StatusPill status={item.status} resolved={item.resolved} />
          <span className="text-[10px] font-bold text-[#7C9791] dark:text-[#5a9e94] uppercase tracking-wide">
            {item.referenceId}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[#7C9791] dark:text-[#5a9e94] hover:text-[#1A534A] dark:hover:text-[#7dd3c0] transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Inquiry preview — always visible */}
      <div className="px-5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791] dark:text-[#5a9e94] mb-1">
          Inquiry
        </p>
        <p className="text-sm text-[#1A534A] dark:text-[#7dd3c0] italic">
          &quot;{item.inquiry}&quot;
        </p>
      </div>

      {/* Expanded: response + actions */}
      {expanded && (
        <div className="px-5 pb-4 flex flex-col gap-3 border-t border-black/5 dark:border-white/10 pt-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C9791] dark:text-[#5a9e94] mb-1">
              Response
            </p>
            <p className="text-sm text-[#5B7571] dark:text-[#8fada9]">{item.response}</p>
          </div>
          <div className="flex items-center gap-4 pt-1">
            <button
              type="button"
              onClick={() => onViewContext(item.conversationId)}
              className="flex items-center gap-1 text-xs font-semibold text-[#1A534A] dark:text-[#7dd3c0] hover:underline"
            >
              View Full Conversation Context <ArrowRight className="w-3 h-3" />
            </button>
            {item.status === "flagged" && !item.resolved && (
              <button
                type="button"
                onClick={() => onResolve(item.id)}
                className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline"
              >
                <CheckCircle2 className="w-3 h-3" /> Mark as Resolved
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChatAuditLogsPage() {
  const router = useRouter();

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AuditStatus>("all");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [useRange, setUseRange] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Data
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  // Context modal
  const [contextLoading, setContextLoading] = useState(false);
  const [context, setContext] = useState<ConversationContext | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (p: number) => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) { router.replace("/login"); return; }

    setLoading(true);
    setError("");
    const result = await getAuditLogs(accessToken, {
      search: search || undefined,
      status,
      date: useRange ? undefined : selectedDate,
      startDate: useRange ? startDate : undefined,
      endDate: useRange ? endDate : undefined,
      page: p,
      pageSize: PAGE_SIZE,
    });

    if (result.success) {
      setItems(result.items);
      setTotal(result.total);
    } else {
      const fail = result as { success: false; message: string; status: number };
      if (fail.status === 401 || fail.status === 403) { router.replace("/login"); return; }
      setError(fail.message);
    }
    setLoading(false);
  }, [search, status, selectedDate, startDate, endDate, useRange, router]);

  // Reload when filters change (debounce search)
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { setPage(1); load(1); }, 400);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search, status, selectedDate, startDate, endDate, useRange, load]);

  useEffect(() => { load(page); }, [page, load]);

  async function handleResolve(logId: string) {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) return;
    const result = await resolveAuditLog(accessToken, logId);
    if (result.success) {
      setItems((prev) => prev.map((item) => item.id === logId ? { ...item, resolved: true } : item));
    }
  }

  async function handleViewContext(conversationId: string) {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) return;
    setContextLoading(true);
    const result = await getConversationContext(accessToken, conversationId);
    setContextLoading(false);
    if (result.success) setContext(result.context);
  }

  async function handleExport() {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) return;
    setExporting(true);
    await exportAuditLogsPdf(accessToken, {
      search: search || undefined,
      status,
      startDate: useRange ? startDate : selectedDate,
      endDate: useRange ? endDate : selectedDate,
    });
    setExporting(false);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-[#1A534A] dark:text-[#7dd3c0]">
              Chat Audit Logs
            </h1>
            <p className="text-sm text-[#5B7571] dark:text-[#8fada9] mt-1">
              Review chatbot conversations, investigate flagged responses, and monitor AI performance.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex-shrink-0 flex items-center gap-2 bg-[#1A534A] dark:bg-[#2a6b5e] hover:bg-[#134038] disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-full transition-colors shadow-sm"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export PDF
          </button>
        </div>

        {/* Search + filter bar */}
        <div className="flex flex-wrap items-center gap-3 mt-6 mb-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7C9791] dark:text-[#5a9e94]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs by content, ID or user reference..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1a2e2b] text-sm text-[#1A534A] dark:text-[#7dd3c0] placeholder:text-[#7C9791] dark:placeholder:text-[#5a9e94] focus:outline-none focus:ring-2 focus:ring-[#1A534A]/30 dark:focus:ring-[#7dd3c0]/20"
            />
          </div>

          {/* Date picker */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#1a2e2b] border border-black/10 dark:border-white/10 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-[#7C9791] dark:text-[#5a9e94] flex-shrink-0" />
            {!useRange ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm text-[#1A534A] dark:text-[#7dd3c0] bg-transparent focus:outline-none"
              />
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-sm text-[#1A534A] dark:text-[#7dd3c0] bg-transparent focus:outline-none"
                />
                <span className="text-xs text-[#7C9791]">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-sm text-[#1A534A] dark:text-[#7dd3c0] bg-transparent focus:outline-none"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => setUseRange((v) => !v)}
              className="text-[10px] font-bold text-[#7C9791] dark:text-[#5a9e94] hover:text-[#1A534A] dark:hover:text-[#7dd3c0] ml-1 uppercase tracking-wide"
            >
              {useRange ? "Single" : "Range"}
            </button>
          </div>

          {/* Parameters toggle */}
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-colors ${
              showFilters
                ? "bg-[#1A534A] dark:bg-[#2a6b5e] text-white border-transparent"
                : "bg-white dark:bg-[#1a2e2b] text-[#1A534A] dark:text-[#7dd3c0] border-black/10 dark:border-white/10 hover:bg-[#eaf5f0] dark:hover:bg-[#243f3b]"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Parameters
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={() => {
              setSearch(""); setStatus("all");
              setSelectedDate(todayISO()); setStartDate(""); setEndDate(""); setUseRange(false);
            }}
            className="text-sm font-semibold text-[#5B7571] dark:text-[#8fada9] hover:text-[#1A534A] dark:hover:text-[#7dd3c0] transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Advanced filters panel */}
        {showFilters && (
          <div className="bg-white dark:bg-[#1a2e2b] rounded-2xl border border-black/10 dark:border-white/10 p-4 mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#5B7571] dark:text-[#8fada9] mr-2">Status:</span>
            {(["all", "answered", "declined", "flagged"] as AuditStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`capitalize text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                  status === s
                    ? "bg-[#1A534A] dark:bg-[#2a6b5e] text-white"
                    : "bg-[#eaf5f0] dark:bg-[#243f3b] text-[#1A534A] dark:text-[#7dd3c0] hover:bg-[#d4ede7] dark:hover:bg-[#2d4f4a]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 mb-4">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Log list */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-[#7C9791]" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search className="w-8 h-8 text-[#7C9791] dark:text-[#5a9e94] mb-3" />
            <p className="text-sm font-semibold text-[#1A534A] dark:text-[#7dd3c0]">No logs found</p>
            <p className="text-xs text-[#5B7571] dark:text-[#8fada9] mt-1">
              Try adjusting your filters or search query.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <LogRow
                key={item.id}
                item={item}
                onResolve={handleResolve}
                onViewContext={handleViewContext}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-xs text-[#5B7571] dark:text-[#8fada9]">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm font-semibold text-[#1A534A] dark:text-[#7dd3c0] disabled:opacity-40 hover:underline"
              >
                Previous
              </button>
              <span className="text-xs text-[#5B7571] dark:text-[#8fada9]">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-sm font-semibold text-[#1A534A] dark:text-[#7dd3c0] disabled:opacity-40 hover:underline"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Context modal */}
      {contextLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}
      {context && <ContextModal context={context} onClose={() => setContext(null)} />}
    </AdminLayout>
  );
}
