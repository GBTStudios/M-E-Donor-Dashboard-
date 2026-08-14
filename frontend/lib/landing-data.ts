/**
 * Data fetchers for the landing page's "live" sections.
 *
 * cache: "no-store" means every page load fetches fresh data directly from
 * the backend, no caching layer in between. Admin edits to stats/stories
 * are reflected on the very next normal page load — no hard refresh, no
 * cache clearing needed. This trades a small amount of backend load for
 * correctness, which is the right tradeoff for admin-editable content.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface LandingStats {
  participants: number;
  graduation_rate: number;
  employment_rate: number;
  income_growth_multiplier: number;
  cohorts: number;
  refugee_participants_pct: number;
}

const FALLBACK_STATS: LandingStats = {
  participants: 153,
  graduation_rate: 93,
  employment_rate: 98,
  income_growth_multiplier: 22,
  cohorts: 6,
  refugee_participants_pct: 4,
};

export async function fetchLandingStats(): Promise<LandingStats> {
  try {
    const res = await fetch(`${API_URL}/stats/landing-summary`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch landing stats");
    return await res.json();
  } catch {
    return FALLBACK_STATS;
  }
}

export interface Story {
  id: string;
  name: string;
  title: string;
  body: string;
  image_url: string | null;
}

const FALLBACK_STORIES: Story[] = [
  {
    id: "1",
    name: "Joan Kisakye",
    title: "From odd jobs to software engineering",
    body: "Joan learned to build and maintain apps and now works as a software Engineer.",
    image_url: null,
  },
  {
    id: "2",
    name: "Brian Mugisha",
    title: "From casual labor to data analysis",
    body: "Brian completed the programme and now works as a data analyst for a logistics company in Kampala.",
    image_url: null,
  },
  {
    id: "3",
    name: "Aisha Namubiru",
    title: "From street vending to product design",
    body: "Aisha now designs digital products for a fintech startup, after starting the programme with no formal tech background.",
    image_url: null,
  },
];

export async function fetchStories(limit = 6): Promise<Story[]> {
  try {
    const res = await fetch(`${API_URL}/stories?limit=${limit}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch stories");
    return await res.json();
  } catch {
    return FALLBACK_STORIES;
  }
}

// Full list for the public Success Stories page — requests the backend's
// max (50, enforced server-side in stories.py). If the program ever has
// more graduates than that, the limit itself needs raising on the backend.
export async function fetchAllStories(): Promise<Story[]> {
  return fetchStories(50);
}
