"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import type { Story } from "@/lib/landing-data";

function StoryCard({ story }: { story: Story }) {
  const { t } = useTranslation("donor");
  const [expanded, setExpanded] = useState(false);
  const isLong = story.body.length > 140;

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm shadow-black/[0.03] overflow-hidden flex flex-col">
      <div className="aspect-[4/3] bg-gradient-to-br from-[#1A534A] to-[#2d7a6c] flex items-center justify-center overflow-hidden">
        {story.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={story.image_url} alt={story.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white text-4xl font-semibold">
            {story.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs font-semibold tracking-wide uppercase text-[#1A534A]/70">
          {story.title}
        </p>
        <p className="font-semibold text-gray-900 text-base mt-1">{story.name}</p>
        <p className={`text-sm text-gray-600 mt-2.5 leading-relaxed flex-1 ${!expanded ? "line-clamp-3" : ""}`}>
          {story.body}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 text-sm text-[#1A534A] font-semibold mt-3 self-start hover:underline"
          >
            {expanded ? t("shared.stories.showLess") : t("shared.stories.readMore")}
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function StoriesGrid({ stories }: { stories: Story[] }) {
  const { t } = useTranslation("donor");

  if (stories.length === 0) {
    return (
      <p className="text-center text-gray-500 py-16">
        {t("shared.stories.empty")}
      </p>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} />
      ))}
    </div>
  );
}