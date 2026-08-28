"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { CohortProject } from "@/lib/donorDashboard";

const BODY_PREVIEW_LENGTH = 180;
const AUTOPLAY_INTERVAL = 4000;

function ProjectCard({ project }: { project: CohortProject }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = project.body.length > BODY_PREVIEW_LENGTH;
  const displayBody =
    expanded || !needsTruncation
      ? project.body
      : project.body.slice(0, BODY_PREVIEW_LENGTH) + "…";

  return (
    <div className="bg-white rounded-2xl border border-black/10 overflow-hidden shadow-sm">
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

export default function ProjectCarousel({ projects }: { projects: CohortProject[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % projects.length);
  }, [projects.length]);

  useEffect(() => {
    if (projects.length <= 1 || paused) return;
    const timer = setInterval(next, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [projects.length, paused, next]);

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
      <ProjectCard project={projects[index]} />

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
