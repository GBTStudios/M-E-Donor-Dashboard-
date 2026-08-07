"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import FlaggedConversationCard from "@/components/admin/FlaggedConversationCard";
import { fetchFlaggedConversations, FlaggedItem, ModerationStatus } from "@/lib/qaAnalytics";

const TABS: { value: ModerationStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "false_positive", label: "False Positive" },
];

export default function FlaggedConversationsList() {
  const router = useRouter();
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<ModerationStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchFlaggedConversations({
      status: status === "all" ? undefined : status,
      search: search || undefined,
    });

    if (result.success && result.items) {
      setItems(result.items);
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
  }, [status, search, router]);

  useEffect(() => {
    load();
  }, [load]);

  if (accessDenied) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-gray-500">You do not have admin access to view this section.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800">Flagged Conversations</h2>
          <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {total} total
          </span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatus(tab.value)}
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                status === tab.value
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by question or donor..."
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-black/10 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 mb-4">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-black/5 p-10 text-center text-sm text-gray-400">
          No flagged conversations match this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <FlaggedConversationCard key={item.id} item={item} onUpdated={load} />
          ))}
        </div>
      )}
    </div>
  );
}
