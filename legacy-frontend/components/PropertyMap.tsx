import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Property } from '../lib/types';

// General area centers, used when live OwnerRez coordinates aren't available
// (e.g. the static fallback). Keeps the map populated and on-brand.
const AREA_CENTERS: { name: string; lat: number; lng: number }[] = [
  { name: 'Atlanta', lat: 33.749, lng: -84.388 },
  { name: 'Acworth', lat: 34.0664, lng: -84.6769 },
  { name: 'Forest Park', lat: 33.6223, lng: -84.3691 },
];

const ATLANTA_CENTER: [number, number] = [33.78, -84.45];

// White circular pin with a navy house glyph — matches the site's brand mark.
const HOUSE_PIN_HTML = `
  <div style="width:34px;height:34px;border-radius:9999px;background:#fff;box-shadow:0 1px 5px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a5f" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  </div>`;

function houseIcon(): L.DivIcon {
  return L.divIcon({
    className: 'sg-house-marker',
    html: HOUSE_PIN_HTML,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });
}

interface MapPoint {
  name: string;
  lat: number;
  lng: number;
}

export default function PropertyMap({ properties }: { properties: Property[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = L.map(el, {
      scrollWheelZoom: false, // don't hijack page scroll; pinch/buttons still zoom
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Prefer real per-property coordinates; fall back to general area centers.
    const located: MapPoint[] = properties
      .filter(
        (p): p is Property & { latitude: number; longitude: number } =>
          typeof p.latitude === 'number' &&
          typeof p.longitude === 'number' &&
          Number.isFinite(p.latitude) &&
          Number.isFinite(p.longitude),
      )
      .map((p) => ({ name: p.name, lat: p.latitude, lng: p.longitude }));

    const points = located.length > 0 ? located : AREA_CENTERS;

    const icon = houseIcon();
    const latlngs: L.LatLngTuple[] = [];
    for (const pt of points) {
      L.marker([pt.lat, pt.lng], { icon, title: pt.name })
        .addTo(map)
        .bindPopup(pt.name);
      latlngs.push([pt.lat, pt.lng]);
    }

    if (latlngs.length > 1) {
      map.fitBounds(latlngs, { padding: [40, 40], maxZoom: 13 });
    } else if (latlngs.length === 1) {
      map.setView(latlngs[0], 12);
    } else {
      map.setView(ATLANTA_CENTER, 10);
    }

    // The container starts at 0 height during mount in some layouts; nudge it.
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
    };
  }, [properties]);

  return (
    <div
      ref={containerRef}
      // relative z-0 isolates Leaflet's internal pane z-indexes so they can't
      // paint over the fixed navbar (z-50) while scrolling.
      className="relative z-0 aspect-video w-full rounded-2xl overflow-hidden border border-silver-700/30"
    />
  );
}
