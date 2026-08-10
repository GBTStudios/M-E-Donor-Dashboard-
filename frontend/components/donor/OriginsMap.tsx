"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { OriginsData } from "@/lib/donorDashboard";

// Leaflet reads `window` as soon as it's imported, which breaks Next.js's
// server-side rendering. Loading it via next/dynamic with ssr:false keeps
// it strictly client-side, which is required for any Leaflet map in Next.
const OriginsMapLeaflet = dynamic(() => import("./OriginsMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="bg-[#f5efe4] rounded-xl border border-black/5 flex items-center justify-center" style={{ height: 360 }}>
      <p className="text-sm text-gray-400">Loading map...</p>
    </div>
  ),
});

export default function OriginsMap({ origins }: { origins: OriginsData }) {
  const pending = origins.uganda_districts.filter(
    (d) => d.latitude === null || d.longitude === null
  );

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-800">Where Our Talents Originate From</h2>
      <p className="text-xs text-gray-500 mb-4">
        {origins.uganda_districts.length} districts across Uganda
        {origins.international.length > 0 && ", plus international participants"}
      </p>

      <div className="rounded-xl overflow-hidden border border-black/5">
        <OriginsMapLeaflet districts={origins.uganda_districts} international={origins.international} />
      </div>

      {origins.international.length > 0 && (
        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1A534A] inline-block" />
            District
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B5762A] inline-block" />
            Country
          </span>
        </div>
      )}

      {pending.length > 0 && (
        <p className="text-[11px] text-gray-400 mt-2">
          Location pending for: {pending.map((d) => d.district).join(", ")}
        </p>
      )}

      {origins.international.length > 0 && (
        <div className="mt-4 pt-4 border-t border-black/5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Also Representing
          </p>
          <div className="flex flex-wrap gap-2">
            {origins.international.map((c) => (
              <span
                key={c.country}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-[#eaf5f0] text-[#1A534A] px-3 py-1.5 rounded-full"
              >
                <MapPin className="w-3 h-3" />
                {c.country} &middot; {c.participant_count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}