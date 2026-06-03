/**
 * LiveMap — Leaflet + OpenStreetMap tiles. No API key required.
 *
 * Props:
 *   center   — {lat, lng}  user position (blue dot)
 *   markers  — optional place markers (H/P/S coloured pins)
 *   height   — CSS height (default "320px")
 *   zoom     — initial zoom (default 15)
 */
import { useEffect, useRef } from "react";
import L from "leaflet";

// ── Fix Leaflet default-icon paths broken by Vite bundler ──────────────────
import markerIconUrl     from "leaflet/dist/images/marker-icon.png";
import markerIcon2xUrl   from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl   from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl:     markerShadowUrl,
});

// ── "You are here" — blue pulsing circle ───────────────────────────────────
const YOU_ICON = L.divIcon({
  className: "",
  html: `<div style="
    width:16px;height:16px;
    background:#3b82f6;
    border:3px solid #ffffff;
    border-radius:50%;
    box-shadow:0 0 0 5px rgba(59,130,246,0.25), 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize:   [16, 16],
  iconAnchor: [8, 8],
});

// ── Place icon (H / P / S coloured teardrop) ───────────────────────────────
const PLACE_COLORS: Record<string, string> = {
  hospital: "#ef4444",
  police:   "#6366f1",
  shelter:  "#ec4899",
};
const PLACE_LABELS: Record<string, string> = {
  hospital: "H",
  police:   "P",
  shelter:  "S",
};

function placeIcon(type: "hospital" | "police" | "shelter") {
  const bg    = PLACE_COLORS[type] ?? "#6b7280";
  const label = PLACE_LABELS[type] ?? "?";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;
      background:${bg};
      color:#fff;font-weight:700;font-size:13px;
      display:flex;align-items:center;justify-content:center;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    "><span style="transform:rotate(45deg)">${label}</span></div>`,
    iconSize:    [28, 28],
    iconAnchor:  [14, 28],
    popupAnchor: [0, -30],
  });
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: "hospital" | "police" | "shelter";
  distance?: number;
  phone?: string;
}

interface LiveMapProps {
  center:   { lat: number; lng: number };
  markers?: MapMarker[];
  height?:  string;
  zoom?:    number;
}

// ── Component ──────────────────────────────────────────────────────────────
export function LiveMap({
  center,
  markers = [],
  height  = "320px",
  zoom    = 15,
}: LiveMapProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const youRef        = useRef<L.Marker | null>(null);
  const placeMarkersRef = useRef<L.Marker[]>([]);

  // ── Initialise map once on mount ────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    // Guard: if Leaflet already owns this container, remove first
    if ((containerRef.current as any)._leaflet_id) {
      return;
    }

    const map = L.map(containerRef.current, {
      center:            [center.lat, center.lng],
      zoom,
      zoomControl:       true,
      scrollWheelZoom:   true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    youRef.current = L.marker([center.lat, center.lng], { icon: YOU_ICON })
      .addTo(map)
      .bindPopup("<b>📍 You are here</b>")
      .openPopup();

    mapRef.current = map;

    // invalidateSize after DOM settles (fixes grey tiles on first render)
    const t = setTimeout(() => map.invalidateSize(), 200);

    return () => {
      clearTimeout(t);
      placeMarkersRef.current.forEach((m) => m.remove());
      placeMarkersRef.current = [];
      map.remove();
      mapRef.current  = null;
      youRef.current  = null;
    };
    // run only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update "you" marker + pan when GPS changes ──────────────────────────
  useEffect(() => {
    if (!mapRef.current || !youRef.current) return;
    const latlng: L.LatLngExpression = [center.lat, center.lng];
    youRef.current.setLatLng(latlng);
    mapRef.current.panTo(latlng, { animate: true, duration: 0.5 });
  }, [center.lat, center.lng]);

  // ── Rebuild place markers whenever the list changes ─────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove previous place markers
    placeMarkersRef.current.forEach((m) => m.remove());
    placeMarkersRef.current = [];

    markers.forEach((place) => {
      const popup = [
        `<b>${place.name}</b>`,
        `Type: ${place.type}`,
        place.distance != null ? `Distance: ${place.distance.toFixed(1)} km` : "",
        place.phone ? `📞 ${place.phone}` : "",
      ]
        .filter(Boolean)
        .join("<br/>");

      const m = L.marker([place.lat, place.lng], { icon: placeIcon(place.type) })
        .addTo(mapRef.current!)
        .bindPopup(popup);

      placeMarkersRef.current.push(m);
    });

    // Fit bounds to show user + all places
    if (markers.length > 0) {
      const allPoints: L.LatLngExpression[] = [
        [center.lat, center.lng],
        ...markers.map((p) => [p.lat, p.lng] as L.LatLngExpression),
      ];
      mapRef.current.fitBounds(L.latLngBounds(allPoints), {
        padding: [48, 48],
        maxZoom: 15,
        animate: true,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  return (
    <div
      ref={containerRef}
      style={{
        height,
        width:        "100%",
        borderRadius: "0 0 0.5rem 0.5rem",
        overflow:     "hidden",
        zIndex:       0,          // keep below modals/toasts
      }}
      aria-label="Live map showing your location and nearby services"
    />
  );
}
