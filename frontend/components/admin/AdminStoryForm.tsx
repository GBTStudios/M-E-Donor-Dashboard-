"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ImagePlus } from "lucide-react";
import { createAdminStory, updateAdminStory, Story } from "@/lib/adminStories";

const MAX_BODY_WORDS = 300;

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

interface AdminStoryFormProps {
  mode: "create" | "edit";
  storyId?: string;
  initialStory?: Story;
}

export default function AdminStoryForm({ mode, storyId, initialStory }: AdminStoryFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialStory?.name ?? "");
  const [title, setTitle] = useState(initialStory?.title ?? "");
  const [body, setBody] = useState(initialStory?.body ?? "");
  const [featured, setFeatured] = useState(initialStory?.featured ?? false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialStory?.image_url ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  const fieldsFilled = name.trim().length > 0 && title.trim().length > 0 && body.trim().length > 0;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;

    if (!file) {
      setImage(null);
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("Image must be a JPEG, PNG, or WEBP file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setError("");
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleBodyChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    if (countWords(value) <= MAX_BODY_WORDS) {
      setBody(value);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!fieldsFilled) {
      setError("Please fill in the name, title, and body.");
      return;
    }

    if (countWords(body) > MAX_BODY_WORDS) {
      setError(`Story body must be ${MAX_BODY_WORDS} words or fewer.`);
      return;
    }

    setSaving(true);

    const result =
      mode === "create"
        ? await createAdminStory({ name, title, body, featured, image })
        : await updateAdminStory(storyId!, { name, title, body, featured, image });

    setSaving(false);

    if (result.success) {
      router.push("/admin/stories");
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

    if (result.status === 404) {
      setError("This story no longer exists. It may have already been deleted.");
      return;
    }

    setError(result.error ?? "Something went wrong.");
  }

  if (accessDenied) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-semibold text-gray-800">Access denied</h1>
        <p className="text-sm text-gray-500 mt-2">
          You do not have admin access to do this.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-semibold text-gray-800">
        {mode === "create" ? "New Story" : "Edit Story"}
      </h1>

      <div>
        <label htmlFor="name" className="text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Joan Kisakye"
          className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700"
        />
      </div>

      <div>
        <label htmlFor="title" className="text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="From odd jobs to software engineering"
          className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700"
        />
      </div>

      <div>
        <label htmlFor="body" className="text-sm font-medium text-gray-700">
          Body
        </label>
        <textarea
          id="body"
          rows={4}
          value={body}
          onChange={handleBodyChange}
          placeholder="Joan learned to build and maintain apps and now works as a software engineer."
          className="w-full mt-1 px-3 py-2.5 rounded-lg border border-black/10 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-700"
        />
        <p
          className={`text-xs mt-1 text-right ${
            countWords(body) >= MAX_BODY_WORDS
              ? "text-red-600"
              : countWords(body) >= 250
              ? "text-amber-600"
              : "text-gray-400"
          }`}
        >
          {countWords(body)} / {MAX_BODY_WORDS} words
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Photo</label>
        <div className="flex items-center gap-4 mt-1">
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <ImagePlus className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="text-sm text-gray-600"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, or WEBP. Max 5MB.</p>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="rounded border-black/20 accent-teal-700"
        />
        Feature this story (shown first on the landing page)
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!fieldsFilled || saving}
          className="bg-teal-800 hover:bg-teal-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {saving ? "Saving..." : mode === "create" ? "Create Story" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/stories")}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
