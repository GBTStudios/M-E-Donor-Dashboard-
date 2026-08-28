"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, ImageOff, Upload, ChevronDown, ChevronUp, Users, CheckCircle2, Clock,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  fetchAdminCohorts, fetchCohortProjects, uploadProjectImage,
  type AdminCohort, type AdminCohortProject,
} from "@/lib/adminCohorts";

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
        <CheckCircle2 className="w-3 h-3" /> Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
      <Clock className="w-3 h-3" /> In Progress
    </span>
  );
}

// ── Project card ──────────────────────────────────────────────────────────────

function ProjectCard({
  project,
  onImageUploaded,
}: {
  project: AdminCohortProject;
  onImageUploaded: (projectId: string, imageUrl: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setError("");
    setUploading(true);
    const result = await uploadProjectImage(project.cohort_id, project.id, file);
    setUploading(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      onImageUploaded(project.id, result.image_url);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm">
      {/* Image */}
      <div className="relative">
        {project.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.image_url}
            alt={project.title}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-40 bg-[#eaf5f0] flex flex-col items-center justify-center gap-2">
            <ImageOff className="w-6 h-6 text-[#7C9791]" />
            <p className="text-xs text-[#7C9791]">No image</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-2 right-2 flex items-center gap-1.5 text-xs font-semibold bg-[#1A534A] hover:bg-[#134038] text-white px-3 py-1.5 rounded-full shadow transition-colors disabled:opacity-60"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {project.image_url ? "Change" : "Upload"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {error && <p className="text-xs text-red-600 px-4 pt-2">{error}</p>}

      <div className="p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[#7C9791] mb-0.5">{project.name}</p>
        <p className="text-sm font-semibold text-[#1A534A]">{project.title}</p>
        <p className="text-xs text-[#5B7571] mt-1 line-clamp-3">{project.body}</p>
      </div>
    </div>
  );
}

// ── Cohort section ────────────────────────────────────────────────────────────

function CohortSection({ cohort }: { cohort: AdminCohort }) {
  const [expanded, setExpanded] = useState(false);
  const [projects, setProjects] = useState<AdminCohortProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (loaded) return;
    setLoading(true);
    const result = await fetchCohortProjects(cohort.id);
    setLoading(false);
    setLoaded(true);
    if ("error" in result) {
      setError(result.error);
    } else {
      setProjects(result.projects);
    }
  }

  function handleToggle() {
    if (!expanded && !loaded) load();
    setExpanded((v) => !v);
  }

  function handleImageUploaded(projectId: string, imageUrl: string) {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, image_url: imageUrl } : p))
    );
  }

  return (
    <div className="bg-[#eaf5f0] rounded-2xl border border-black/10 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-[#d4ede7] transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#1A534A] truncate text-left">
              {cohort.program ?? cohort.name}
            </p>
            <p className="text-xs text-[#5B7571] text-left">{cohort.name}</p>
          </div>
          <StatusBadge status={cohort.status} />
          <div className="flex items-center gap-1 text-xs text-[#7C9791]">
            <Users className="w-3 h-3" />
            <span>{cohort.active_participants}</span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[#7C9791] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#7C9791] flex-shrink-0" />
        )}
      </button>

      {/* Projects */}
      {expanded && (
        <div className="px-6 pb-6 border-t border-black/5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-[#7C9791]" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 py-4">{error}</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-[#7C9791] py-4 text-center">
              No projects extracted yet for this cohort. Upload a report to generate them.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onImageUploaded={handleImageUploaded}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminCohortsPage() {
  const router = useRouter();
  const [cohorts, setCohorts] = useState<AdminCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchAdminCohorts();
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setCohorts(result.cohorts);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#1A534A] mb-1">Cohort Projects</h1>
        <p className="text-sm text-[#5B7571] mb-8">
          Upload images for notable projects extracted from cohort reports.
        </p>

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-6 h-6 animate-spin text-[#7C9791]" />
          </div>
        ) : cohorts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-sm text-[#5B7571]">No cohorts found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {cohorts.map((cohort) => (
              <CohortSection key={cohort.id} cohort={cohort} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
