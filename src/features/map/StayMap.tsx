import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from '../../components/icons';
import type { Stay } from '../../types/domain';
import styles from './StayMap.module.css';

interface MapPoint {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

/** Fallback centres for the areas we host in, used when no stay has coordinates. */
const AREA_CENTRES: MapPoint[] = [
  { id: 'atlanta', label: 'Atlanta', lat: 33.749, lng: -84.388 },
  { id: 'acworth', label: 'Acworth', lat: 34.0664, lng: -84.6769 },
  { id: 'forest-park', label: 'Forest Park', lat: 33.6223, lng: -84.3691 },
];

const METRO_CENTRE: L.LatLngTuple = [33.78, -84.45];

/** Marker artwork drawn for this design system: a clay pin on a paper disc. */
const MARKER_HTML = `
<span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:#f7f4ee;border:1px solid #c6bca8;box-shadow:0 2px 6px rgba(23,21,15,.28)">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a9482a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 21c4-4.6 6-8 6-10.8A6 6 0 0 0 6 10.2C6 13 8 16.4 12 21Z"/>
    <circle cx="12" cy="10.2" r="2.3"/>
  </svg>
</span>`;

interface StayMapProps {
  stays: Stay[];
  /** Optional accessible caption below the map. */
  caption?: string;
  /** Renders a keyboard-reachable list of the plotted places. */
  showList?: boolean;
  onSelect?: (stayId: string) => void;
}

/**
 * Leaflet map over OpenStreetMap tiles. The chip list underneath is not
 * decoration: a raster map is unusable with a screen reader or a keyboard, so
 * the same places are also exposed as ordinary buttons.
 */
export function StayMap({ stays, caption, showList = true, onSelect }: StayMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const located: MapPoint[] = stays
    .filter(
      (stay): stay is Stay & { address: { latitude: number; longitude: number; locality: string; full: string } } =>
        typeof stay.address.latitude === 'number' && typeof stay.address.longitude === 'number',
    )
    .map((stay) => ({
      id: stay.id,
      label: stay.name,
      lat: stay.address.latitude,
      lng: stay.address.longitude,
    }));

  const points = located.length > 0 ? located : AREA_CENTRES;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const map = L.map(element, { scrollWheelZoom: false, zoomControl: true });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const markerIcon = L.divIcon({
      className: 'sg-map-pin',
      html: MARKER_HTML,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -14],
    });

    const bounds: L.LatLngTuple[] = [];
    for (const point of points) {
      L.marker([point.lat, point.lng], { icon: markerIcon, title: point.label })
        .addTo(map)
        .bindPopup(point.label);
      bounds.push([point.lat, point.lng]);
    }

    if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    else if (bounds.length === 1) map.setView(bounds[0], 13);
    else map.setView(METRO_CENTRE, 10);

    // The container can mount at zero height inside a grid; nudge Leaflet once.
    const raf = window.requestAnimationFrame(() => map.invalidateSize());

    return () => {
      window.cancelAnimationFrame(raf);
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.map((point) => `${point.id}:${point.lat}:${point.lng}`).join('|')]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.map} ref={containerRef} role="img" aria-label="Map of our homes across metro Atlanta" />

      {showList && (
        <ul className={styles.list}>
          {points.map((point) => (
            <li key={point.id}>
              {onSelect && located.length > 0 ? (
                <button type="button" className={styles.chip} onClick={() => onSelect(point.id)}>
                  <Icon name="pin" size={13} />
                  {point.label}
                </button>
              ) : (
                <span className={styles.chip}>
                  <Icon name="pin" size={13} />
                  {point.label}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {caption && <p className={styles.caption}>{caption}</p>}
    </div>
  );
}
