"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2, Plus, Star, ChevronDown } from "lucide-react";
import { fetchAdminStories, deleteAdminStory, Story } from "@/lib/adminStories";

const INITIAL_VISIBLE = 10;

export default function AdminStoriesList() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadStories();
  }, []);

  async function loadStories() {
    setLoading(true);
    const result = await fetchAdminStories();

    if (result.success && result.stories) {
      setStories(result.stories);
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
  }

  async function handleDelete(id: string, name: string) {
    const confirmed = window.confirm(`Delete the story for "${name}"? This cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(id);
    const result = await deleteAdminStory(id);
    setDeletingId(null);

    if (result.success) {
      setStories((prev) => prev.filter((s) => s.id !== id));
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

    setError(result.error ?? "Could not delete this story.");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-semibold text-gray-800">Access denied</h1>
        <p className="text-sm text-gray-500 mt-2">
          You do not have admin access to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Impact Stories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Stories shown on the public landing page.
          </p>
        </div>
        <Link
          href="/admin/stories/new"
          className="inline-flex items-center gap-2 bg-teal-800 hover:bg-teal-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          New Story
        </Link>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 mb-4">
          {error}
        </p>
      )}

      {stories.length === 0 ? (
        <p className="text-sm text-gray-500">No stories yet. Create the first one.</p>
      ) : (
        <div className="space-y-3">
          {(showAll ? stories : stories.slice(0, INITIAL_VISIBLE)).map((story) => (
            <div
              key={story.id}
              className="flex items-center gap-4 bg-white rounded-xl border border-black/5 shadow-sm p-4"
            >
              <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                {story.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={story.image_url} alt={story.name} className="w-full h-full object-cover" />
                ) : null}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 truncate">{story.name}</p>
                  {story.featured && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{story.title}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/admin/stories/${story.id}/edit`}
                  aria-label={`Edit ${story.name}'s story`}
                  className="p-2 rounded-lg border border-black/10 text-gray-600 hover:bg-gray-50 transition"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(story.id, story.name)}
                  disabled={deletingId === story.id}
                  aria-label={`Delete ${story.name}'s story`}
                  className="p-2 rounded-lg border border-black/10 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                >
                  {deletingId === story.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showAll && stories.length > INITIAL_VISIBLE && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full flex items-center justify-center gap-2 mt-4 py-2.5 rounded-lg border border-black/10 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          View all stories ({stories.length})
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
