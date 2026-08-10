"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { DistrictOrigin } from "@/lib/donorDashboard";

const UGANDA_CENTER: [number, number] = [1.3733, 32.2903];
const DEFAULT_ZOOM = 7;

export default function OriginsMapLeaflet({ districts }: { districts: DistrictOrigin[] }) {
  const plottable = districts.filter(
    (d): d is DistrictOrigin & { latitude: number; longitude: number } =>
      d.latitude !== null && d.longitude !== null
  );

  const maxCount = Math.max(...plottable.map((d) => d.participant_count), 1);

  const center: [number, number] =
    plottable.length > 0
      ? [
          plottable.reduce((sum, d) => sum + d.latitude, 0) / plottable.length,
          plottable.reduce((sum, d) => sum + d.longitude, 0) / plottable.length,
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
      {plottable.map((d) => {
        const radius = 6 + (d.participant_count / maxCount) * 14;
        return (
          <CircleMarker
            key={d.district}
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
    </MapContainer>
  );
}