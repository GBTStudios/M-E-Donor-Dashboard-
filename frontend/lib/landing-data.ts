/**
 * Data fetchers for the landing page's "live" sections.
 *
 * Both endpoints don't exist on the backend yet (see backend-guide-stories-and-stats.md).
 * Until they're live, these fall back to placeholder data so the page renders
 * correctly during frontend development. Once the backend endpoints exist,
 * remove the try/catch fallback and let failures surface normally (or add
 * proper error UI instead of silently falling back).
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
      next: { revalidate: 3600 }, // re-check once an hour; data barely changes.
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
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Failed to fetch stories");
    return await res.json();
  } catch {
    return FALLBACK_STORIES;
  }
}