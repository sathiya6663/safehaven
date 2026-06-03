/**
 * LiveMap — reusable Leaflet map component using free OpenStreetMap tiles.
 * No API key required.
 *
 * Props:
 *  - center: { lat, lng } — map centre + blue "you are here" marker
 *  - markers: optional array of place markers (red)
 *  - height: CSS height string (default "300px")
 *  - zoom: initial zoom level (default 15)
 */
import { useEffect, useRef } from "react";
import L from "leaflet";

// Fix Leaflet's broken default icon paths when bundled with Vite
import markerIconUrl from "leaflet/dist/images/marker-icon.png";
import markerIcon2xUrl from "leaflet/dist/images/marker-icon-2x.png";
import markerShadowUrl from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
});

// "You are here" — blue pulsing marker
const YOU_ICON = L.divIcon({
  className: "",
  html: `<div style="
    width:18px;height:18px;
    background:#3b82f6;
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 0 0 4px rgba(59,130,246,0.3);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Place icon by type
function placeIcon(type: "hospital" | "police" | "shelter") {
  const colors: Record<string, string> = {
    hospital: "#ef4444",
    police:   "#6366f1",
    shelter:  "#ec4899",
  };
  const labels: Record<string, string> = {
    hospital: "H",
    police:   "P",
    shelter:  "S",
  };
  const bg = colors[type] ?? "#6b7280";
  const label = labels[type] ?? "?";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:28px;height:28px;
      background:${bg};
      color:#fff;
      font-weight:700;
      font-size:13px;
      display:flex;align-items:center;justify-content:center;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);
    "><span style="transform:rotate(45deg)">${label}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

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
  center: { lat: number; lng: number };
  markers?: MapMarker[];
  height?: string;
  zoom?: number;
}

export function LiveMap({ center, markers = [], height = "300px", zoom = 15 }: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef      = useRef<L.Map | null>(null);
  const youRef      = useRef<L.Marker | null>(null);
  const markersRef  = useRef<L.Marker[]>([]);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // "You are here" marker
    youRef.current = L.marker([center.lat, center.lng], { icon: YOU_ICON })
      .addTo(map)
      .bindPopup("<b>You are here</b>")
      .openPopup();

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update "you" marker when center changes
  useEffect(() => {
    if (!mapRef.current || !youRef.current) return;
    youRef.current.setLatLng([center.lat, center.lng]);
    mapRef.current.setView([center.lat, center.lng], mapRef.current.getZoom());
  }, [center.lat, center.lng]);

  // Rebuild place markers when list changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    markers.forEach((place) => {
      const m = L.marker([place.lat, place.lng], { icon: placeIcon(place.type) })
        .addTo(mapRef.current!)
        .bindPopup(
          `<b>${place.name}</b><br/>
           Type: ${place.type}<br/>
           ${place.distance != null ? `Distance: ${place.distance.toFixed(1)} km<br/>` : ""}
           ${place.phone ? `Phone: ${place.phone}` : ""}`
        );
      markersRef.current.push(m);
    });

    // Fit bounds to include user + all markers if any
    if (markers.length > 0) {
      const allPoints: L.LatLngExpression[] = [
        [center.lat, center.lng],
        ...markers.map((p) => [p.lat, p.lng] as L.LatLngExpression),
      ];
      mapRef.current.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40], maxZoom: 15 });
    }
  }, [markers, center.lat, center.lng]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%", borderRadius: "0.5rem", overflow: "hidden" }}
      aria-label="Live map showing your location and nearby services"
    />
  );
}
