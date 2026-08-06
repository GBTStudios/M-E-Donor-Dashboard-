"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import type { OriginsData } from "@/lib/donorDashboard";

// Approximate Uganda bounding box, used to position district markers
// proportionally within the map card. No topojson boundary data is
// available in this project yet, so this is a scatter-plot style map
// (geographically positioned dots), not a filled district-shape map.
const BOUNDS = { minLat: -1.5, maxLat: 4.2, minLng: 29.5, maxLng: 35.0 };

function project(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = 100 - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { x, y };
}

export default function OriginsMap({ origins }: { origins: OriginsData }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const plottable = origins.uganda_districts.filter(
    (d) => d.latitude !== null && d.longitude !== null
  );
  const pending = origins.uganda_districts.filter(
    (d) => d.latitude === null || d.longitude === null
  );
  const maxCount = Math.max(...origins.uganda_districts.map((d) => d.participant_count), 1);

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-800">Where Our Talents Originate From</h2>
      <p className="text-xs text-gray-500 mb-4">
        {origins.uganda_districts.length} districts across Uganda
        {origins.international.length > 0 && ", plus international participants"}
      </p>

      <div className="relative bg-[#f5efe4] rounded-xl border border-black/5 aspect-[4/3] overflow-hidden">
        {plottable.map((d) => {
          const { x, y } = project(d.latitude!, d.longitude!);
          const size = 8 + (d.participant_count / maxCount) * 14;
          return (
            <div
              key={d.district}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%` }}
              onMouseEnter={() => setHovered(d.district)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="rounded-full bg-[#1A534A] border-2 border-white shadow-md transition-transform hover:scale-110"
                style={{ width: size, height: size }}
              />
              {hovered === d.district && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg z-10">
                  <p className="font-semibold">{d.district}</p>
                  <p className="text-white/70">{d.participant_count} participants</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
