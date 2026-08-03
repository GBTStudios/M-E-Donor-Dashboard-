"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminStoryForm from "@/components/admin/AdminStoryForm";
import { fetchAdminStories, Story } from "@/lib/adminStories";

export default function EditStoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const result = await fetchAdminStories();

      if (result.success && result.stories) {
        const match = result.stories.find((s) => s.id === id);
        if (!match) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setStory(match);
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
    load();
  }, [id, router]);

  return (
    <AdminLayout>
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && accessDenied && (
        <div className="text-center py-20">
          <h1 className="text-xl font-semibold text-gray-800">Access denied</h1>
          <p className="text-sm text-gray-500 mt-2">
            You do not have admin access to view this page.
          </p>
        </div>
      )}

      {!loading && notFound && (
        <div className="text-center py-20">
          <h1 className="text-xl font-semibold text-gray-800">Story not found</h1>
          <p className="text-sm text-gray-500 mt-2">
            This story may have already been deleted.
          </p>
        </div>
      )}

      {!loading && error && !accessDenied && !notFound && (
        <p role="alert" className="text-sm text-red-600 text-center">
          {error}
        </p>
      )}

      {!loading && story && (
        <AdminStoryForm mode="edit" storyId={story.id} initialStory={story} />
      )}
    </AdminLayout>
  );
}
