"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { DistrictOrigin, CountryOrigin } from "@/lib/donorDashboard";

const UGANDA_CENTER: [number, number] = [1.3733, 32.2903];
const DEFAULT_ZOOM = 7;

interface OriginsMapLeafletProps {
  districts: DistrictOrigin[];
  international?: CountryOrigin[];
}

export default function OriginsMapLeaflet({ districts, international = [] }: OriginsMapLeafletProps) {
  const plottableDistricts = districts.filter(
    (d): d is DistrictOrigin & { latitude: number; longitude: number } =>
      typeof d.latitude === "number" && typeof d.longitude === "number" &&
      !isNaN(d.latitude) && !isNaN(d.longitude)
  );

  const plottableCountries = international.filter(
    (c): c is CountryOrigin & { latitude: number; longitude: number } =>
      typeof c.latitude === "number" && typeof c.longitude === "number" &&
      !isNaN(c.latitude) && !isNaN(c.longitude)
  );

  const allPlottable = [
    ...plottableDistricts.map((d) => ({ lat: d.latitude, lng: d.longitude })),
    ...plottableCountries.map((c) => ({ lat: c.latitude, lng: c.longitude })),
  ];

  const maxDistrictCount = Math.max(...plottableDistricts.map((d) => d.participant_count), 1);
  const maxCountryCount = Math.max(...plottableCountries.map((c) => c.participant_count), 1);

  const center: [number, number] =
    allPlottable.length > 0
      ? [
          allPlottable.reduce((sum, p) => sum + p.lat, 0) / allPlottable.length,
          allPlottable.reduce((sum, p) => sum + p.lng, 0) / allPlottable.length,
        ]
      : UGANDA_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={false}
      style={{ height: "360px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {plottableDistricts.map((d) => {
        const radius = 6 + (d.participant_count / maxDistrictCount) * 14;
        return (
          <CircleMarker
            key={`district-${d.district}`}
            center={[d.latitude, d.longitude]}
            radius={radius}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: "#1A534A",
              fillOpacity: 0.85,
            }}
          >
            <Tooltip direction="top" offset={[0, -radius]}>
              <span className="font-semibold">{d.district}</span>
              <br />
              {d.participant_count} participant{d.participant_count === 1 ? "" : "s"}
            </Tooltip>
          </CircleMarker>
        );
      })}

      {plottableCountries.map((c) => {
        const radius = 8 + (c.participant_count / maxCountryCount) * 14;
        return (
          <CircleMarker
            key={`country-${c.country}`}
            center={[c.latitude, c.longitude]}
            radius={radius}
            pathOptions={{
              color: "#ffffff",
              weight: 2,
              fillColor: "#B5762A",
              fillOpacity: 0.85,
              dashArray: "3, 2",
            }}
          >
            <Tooltip direction="top" offset={[0, -radius]}>
              <span className="font-semibold">{c.country}</span>
              <br />
              {c.participant_count} participant{c.participant_count === 1 ? "" : "s"}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}