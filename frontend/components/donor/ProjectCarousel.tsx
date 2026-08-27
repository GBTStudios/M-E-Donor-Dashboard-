"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ImageOff, Upload, Loader2 } from "lucide-react";
import type { CohortProject } from "@/lib/donorDashboard";
import { getRole } from "@/lib/adminAuth";
import { getAuthHeaders } from "@/lib/auth";

const BODY_PREVIEW_LENGTH = 180;
const AUTOPLAY_INTERVAL = 4000;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function uploadProjectImage(
  cohortId: string,
  projectId: string,
  file: File
): Promise<{ success: boolean; image_url?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch(
      `${API_URL}/admin/cohorts/${cohortId}/projects/${projectId}/image`,
      {
        method: "POST",
        headers: { ...getAuthHeaders() },
        body: formData,
      }
    );
    if (response.ok) {
      const data = await response.json();
      return { success: true, image_url: data.image_url };
    }
    const data = await response.json().catch(() => ({}));
    return { success: false, error: data.detail ?? "Upload failed." };
  } catch {
    return { success: false, error: "Network error. Please try again." };
  }
}

function ProjectCard({
  project,
  isAdmin,
  onImageUploaded,
}: {
  project: CohortProject;
  isAdmin: boolean;
  onImageUploaded: (projectId: string, imageUrl: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const needsTruncation = project.body.length > BODY_PREVIEW_LENGTH;
  const displayBody =
    expanded || !needsTruncation
      ? project.body
      : project.body.slice(0, BODY_PREVIEW_LENGTH) + "…";

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploadError("");
    setUploading(true);
    const result = await uploadProjectImage(project.cohort_id, project.id, file);
    setUploading(false);
    if (result.success && result.image_url) {
      onImageUploaded(project.id, result.image_url);
    } else {
      setUploadError(result.error ?? "Upload failed.");
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm">
      {/* Image area */}
      <div className="relative">
        {project.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.image_url}
            alt={project.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-[#eaf5f0] flex flex-col items-center justify-center gap-2">
            <ImageOff className="w-8 h-8 text-[#7C9791]" />
            <p className="text-xs text-[#7C9791]">No image yet</p>
          </div>
        )}

        {/* Admin upload button */}
        {isAdmin && (
          <div className="absolute bottom-2 right-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#1A534A] hover:bg-[#134038] text-white px-3 py-1.5 rounded-full shadow transition-colors disabled:opacity-60"
            >
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              {project.image_url ? "Change Image" : "Upload Image"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelected}
            />
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-red-600 px-5 pt-2">{uploadError}</p>
      )}

      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#7C9791] mb-1">{project.name}</p>
        <p className="text-sm font-semibold text-[#1A534A] mb-2">{project.title}</p>
        <p className="text-xs text-[#5B7571] leading-relaxed">{displayBody}</p>
        {needsTruncation && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 text-xs font-semibold text-[#1A534A] hover:underline"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProjectCarousel({ projects: initialProjects }: { projects: CohortProject[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const isAdmin = typeof window !== "undefined"
    ? getRole() === "admin" || getRole() === "superadmin"
    : false;

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % projects.length);
  }, [projects.length]);

  useEffect(() => {
    if (projects.length <= 1 || paused) return;
    const timer = setInterval(next, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [projects.length, paused, next]);

  function handleImageUploaded(projectId: string, imageUrl: string) {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, image_url: imageUrl } : p))
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-[#eaf5f0] rounded-2xl border border-black/10 h-48 flex items-center justify-center">
        <div className="text-center">
          <ImageOff className="w-8 h-8 text-[#7C9791] mx-auto mb-2" />
          <p className="text-xs text-[#5B7571]">No projects yet</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <ProjectCard
        project={projects[index]}
        isAdmin={isAdmin}
        onImageUploaded={handleImageUploaded}
      />

      {projects.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => { setIndex((i) => (i - 1 + projects.length) % projects.length); setPaused(true); }}
            className="absolute left-3 top-24 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-black/10 shadow flex items-center justify-center hover:bg-white transition"
          >
            <ChevronLeft className="w-4 h-4 text-[#1A534A]" />
          </button>
          <button
            type="button"
            onClick={() => { next(); setPaused(true); }}
            className="absolute right-3 top-24 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-black/10 shadow flex items-center justify-center hover:bg-white transition"
          >
            <ChevronRight className="w-4 h-4 text-[#1A534A]" />
          </button>

          <div className="flex items-center justify-center gap-1.5 mt-3">
            {projects.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setIndex(i); setPaused(true); }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === index ? "bg-[#1A534A]" : "bg-[#7C9791]/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
