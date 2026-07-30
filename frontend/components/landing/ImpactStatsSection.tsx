import { fetchLandingStats } from "@/lib/landing-data";

export default async function ImpactStatsSection() {
  const stats = await fetchLandingStats();

  const cards = [
    { label: "Participants", value: `${stats.participants}` },
    { label: "Graduation Rate", value: `${stats.graduation_rate}%` },
    { label: "Employment Rate", value: `${stats.employment_rate}%` },
    { label: "Income Growth", value: `${stats.income_growth_multiplier}×` },
    { label: "Cohorts", value: `${stats.cohorts}` },
    { label: "Refugee Participants", value: `${stats.refugee_participants_pct}%` },
  ];

  return (
    <section id="impact" className="bg-[#eaf5f0] py-20">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-semibold text-gray-900">Our Real-World Impact</h2>
        <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
          Granular data collection from our partner sites across the continent, updated in
          real-time.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-10">
          {cards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-black/5 shadow-sm px-4 py-6"
            >
              <p className="text-2xl font-bold text-[#1A534A]">{card.value}</p>
              <p className="text-[11px] font-medium tracking-wide text-gray-500 uppercase mt-1">
                {card.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}