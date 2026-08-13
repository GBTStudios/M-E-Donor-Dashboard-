"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import DonorLayout from "@/components/donor/DonorLayout";
import StoriesGrid from "@/components/landing/StoriesGrid";
import { fetchAllStories, fetchLandingStats, type Story, type LandingStats } from "@/lib/landing-data";

export default function DonorStoriesPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [stats, setStats] = useState<LandingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [storiesData, statsData] = await Promise.all([fetchAllStories(), fetchLandingStats()]);
      setStories(storiesData);
      setStats(statsData);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <DonorLayout>
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Talent Stories</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Real graduates, real outcomes. Every contribution creates an opportunity — these
            are the full stories of learners whose lives have been changed through the
            program you support.
          </p>
        </div>

        {stats && (
          <div className="w-24 h-24 rounded-full bg-[#1A534A] flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-white">+{stats.participants}</span>
            <span className="text-[10px] font-medium text-white/70 text-center px-2 leading-tight mt-0.5">
              Talents graduated
            </span>
          </div>
        )}
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <StoriesGrid stories={stories} />
        )}
      </div>
    </DonorLayout>
  );
}
