"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom teal marker icon to match design
const tealIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type Props = {
  center: [number, number];
  coords: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
};

function ClickHandler({ onChange }: { onChange: (c: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapPicker({ center, coords, onChange }: Props) {
  const [locating, setLocating] = useState(false);

  function handleGeolocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: "1.5px solid var(--border)" }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: 260, width: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onChange={onChange} />
        {coords && (
          <Marker position={[coords.lat, coords.lng]} icon={tealIcon} />
        )}
      </MapContainer>

      {/* Hint overlay */}
      {!coords && (
        <div style={{
          position: "absolute", bottom: 44, left: "50%", transform: "translateX(-50%)",
          background: "rgba(15,31,29,0.7)", color: "#fff",
          fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 999,
          pointerEvents: "none", whiteSpace: "nowrap", zIndex: 500,
        }}>
          Ketuk peta untuk tandai lokasi
        </div>
      )}

      {/* My location button */}
      <button
        onClick={handleGeolocate}
        disabled={locating}
        style={{
          position: "absolute", bottom: 10, right: 10, zIndex: 500,
          width: 36, height: 36, borderRadius: 10,
          background: "#fff", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          color: locating ? "var(--text-3)" : "var(--primary)",
        }}
        title="Lokasi saya"
      >
        {locating ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
        )}
      </button>
    </div>
  );
}
