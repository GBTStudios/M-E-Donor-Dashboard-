"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, UserRound } from "lucide-react";
import type { Story } from "@/lib/landing-data";

export default function ImpactStoriesSection({ stories }: { stories: Story[] }) {
  const [index, setIndex] = useState(0);

  if (stories.length === 0) return null;

  const story = stories[index];

  function goPrev() {
    setIndex((i) => (i === 0 ? stories.length - 1 : i - 1));
  }

  function goNext() {
    setIndex((i) => (i === stories.length - 1 ? 0 : i + 1));
  }

  return (
    <section className="bg-[#f5efe4] py-20">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-semibold text-gray-900">Impact Stories</h2>
        <p className="text-gray-500 mt-3">
          Every contribution creates an opportunity. Explore the real stories of learners
          whose lives have been changed through the support of donors, mentors, and partners
          who believe in their potential.
        </p>

        <div className="relative mt-10">
          <button
            onClick={goPrev}
            aria-label="Previous story"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-8 w-9 h-9 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center hover:bg-white/80 transition"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>

          <div className="bg-[#eaf5f0] rounded-2xl border border-black/5 p-8 flex items-center gap-6 text-left">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {story.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={story.image_url} alt={story.name} className="w-full h-full object-cover" />
              ) : (
                <UserRound className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <p className="font-semibold text-[#1A534A]">{story.name}</p>
              <p className="text-sm text-gray-600 mt-1">{story.body}</p>
            </div>
          </div>

          <button
            onClick={goNext}
            aria-label="Next story"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-8 w-9 h-9 rounded-full bg-white border border-black/10 shadow-sm flex items-center justify-center hover:bg-white/80 transition"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-6">
          {stories.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              aria-label={`Go to story ${i + 1}`}
              className={`w-1.5 h-1.5 rounded-full transition ${
                i === index ? "bg-[#1A534A] w-4" : "bg-black/15"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}