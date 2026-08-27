"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Quote, ArrowRight } from "lucide-react";
import StoryViewModal from "@/components/ui/StoryViewModal";
import type { Story } from "@/lib/landing-data";

export default function ImpactStoriesSection({ stories }: { stories: Story[] }) {
  const [index, setIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setModalOpen(false);
  }, [index]);

  if (stories.length === 0) return null;

  const story = stories[index];
  const isLong = story.body.length > 160;

  function goPrev() {
    setIndex((i) => (i === 0 ? stories.length - 1 : i - 1));
  }

  function goNext() {
    setIndex((i) => (i === stories.length - 1 ? 0 : i + 1));
  }

  return (
    <section className="bg-gradient-to-b from-[#f5efe4] to-[#eaf5f0] dark:from-[#0f1a18] dark:to-[#122420] py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <span className="inline-block bg-white dark:bg-[#1e3532] border border-black/10 dark:border-white/10 text-xs font-medium text-[#1A534A] dark:text-[#7dd3c0] px-3 py-1.5 rounded-full mb-5">
          Real graduates, real outcomes
        </span>

        <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-[#e2f4f0]">Impact Stories</h2>
        <p className="text-gray-500 dark:text-[#8fada9] mt-3 max-w-xl mx-auto">
          Every contribution creates an opportunity. Explore the real stories of learners
          whose lives have been changed through the support of donors, mentors, and partners
          who believe in their potential.
        </p>

        <div className="relative mt-12 px-14 sm:px-20">
          <button
            onClick={goPrev}
            aria-label="Previous story"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white dark:bg-[#1e3532] border border-black/10 dark:border-white/10 shadow-md flex items-center justify-center hover:bg-[#1A534A] hover:border-[#1A534A] hover:text-white text-gray-600 dark:text-[#8fada9] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="relative bg-white dark:bg-[#1a2e2b] rounded-3xl border border-black/5 dark:border-white/10 shadow-lg shadow-black/[0.03] p-8 sm:p-10 text-left min-h-[260px] sm:min-h-[220px] overflow-hidden">
            <Quote className="absolute top-6 right-6 w-16 h-16 text-[#1A534A]/[0.06] dark:text-[#7dd3c0]/[0.08]" strokeWidth={1} />

            <div className="flex flex-col sm:flex-row items-start gap-6 relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-[#1A534A] to-[#2d7a6c] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                {story.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={story.image_url} alt={story.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-2xl font-semibold">
                    {story.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold tracking-wide uppercase text-[#1A534A]/70 dark:text-[#7dd3c0]/80">
                  {story.title}
                </p>
                <p className="font-semibold text-gray-900 dark:text-[#e2f4f0] text-lg mt-1">{story.name}</p>
                <p className="text-[15px] text-gray-600 dark:text-[#8fada9] mt-3 leading-relaxed line-clamp-4">
                  {story.body}
                </p>
                {isLong && (
                  <button
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-sm text-white font-semibold mt-4 bg-[#1A534A] hover:bg-[#134038] px-4 py-2 rounded-full transition-colors"
                  >
                    Read full story
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={goNext}
            aria-label="Next story"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white dark:bg-[#1e3532] border border-black/10 dark:border-white/10 shadow-md flex items-center justify-center hover:bg-[#1A534A] hover:border-[#1A534A] hover:text-white text-gray-600 dark:text-[#8fada9] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mt-8">
          {stories.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              aria-label={`Go to story ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "bg-[#1A534A] dark:bg-[#7dd3c0] w-6" : "bg-black/15 dark:bg-white/15 w-1.5 hover:bg-black/25 dark:hover:bg-white/25"
              }`}
            />
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[#1A534A] hover:bg-[#134038] text-white text-sm font-semibold px-6 py-3 rounded-full transition-colors"
          >
            View more stories
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-gray-400 dark:text-[#5a9e94] mt-2.5">Log in to view more graduate stories.</p>
        </div>
      </div>

      <StoryViewModal
        open={modalOpen}
        name={story.name}
        title={story.title}
        body={story.body}
        imageUrl={story.image_url}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
