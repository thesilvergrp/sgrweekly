import type { Property } from './types';
import type { OwnerRezProperty } from './ownerrez-types';
import { properties as staticCatalog } from './properties';

/**
 * Repo-managed content enrichment, keyed by OwnerRez property id (string).
 *
 * Permanent split (since this OwnerRez account doesn't have the WordPress
 * Plugin + Integrated Websites premium feature that exposes /v2/listings):
 *   - OwnerRez = operational data (address, bed/bath/sleeps, thumbnail)
 *   - This repo = marketing data (description, amenities, gallery)
 *
 * Joining by id (not name) keeps this stable when external_name is edited
 * in OwnerRez. To add a property: add an entry in ./properties.ts keyed by
 * its OwnerRez id.
 */
const CONTENT_BY_ID = new Map<string, Property>(
  staticCatalog.map((p) => [p.id, p]),
);

const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1600';

const STATE_ABBREV: Record<string, string> = {
  Georgia: 'GA',
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function mapOwnerRezProperty(or: OwnerRezProperty): Property {
  const displayName = or.external_name ?? or.name;
  const enrich = CONTENT_BY_ID.get(String(or.id));

  const state = STATE_ABBREV[or.address.state] ?? or.address.state;
  const location = `${or.address.city}, ${state}`;
  const fullAddress = [
    or.address.street1,
    or.address.street2,
    `${or.address.city}, ${state} ${or.address.postal_code}`,
    titleCase(or.address.country),
  ]
    .filter(Boolean)
    .join(', ');

  // Gallery: the OwnerRez thumbnail is the cover photo, followed by the full
  // repo gallery. Dedupe by image id so the cover isn't repeated when it also
  // appears in the gallery (and -Large/-Medium size variants don't double up).
  const liveImage = or.thumbnail_url_large ?? or.thumbnail_url ?? or.thumbnail_url_medium;
  const merged = dedupeImages([
    ...(liveImage ? [liveImage] : []),
    ...(enrich?.images ?? []),
  ]);
  const images = merged.length > 0 ? merged : [FALLBACK_IMAGE];

  return {
    id: String(or.id),
    name: displayName,
    slug: slugify(displayName),
    description:
      enrich?.description ??
      `${displayName} is a ${humanType(or.property_type)} in ${location}. Sleeps up to ${or.max_guests}.`,
    short_description:
      enrich?.short_description ??
      `${or.bedrooms} ${or.bedrooms === 1 ? 'bedroom' : 'bedrooms'} · ${or.bathrooms} ${or.bathrooms === 1 ? 'bath' : 'baths'} · sleeps ${or.max_guests}.`,
    location,
    address: fullAddress,
    latitude: or.latitude,
    longitude: or.longitude,
    bedrooms: or.bedrooms,
    beds: enrich?.beds ?? Math.max(or.bedrooms, 1),
    bathrooms: or.bathrooms,
    max_guests: or.max_guests,
    // price_per_night is in cents. Real per-week pricing lives in the quotes
    // endpoint — until that's wired, prefer enriched static price, else $X/wk.
    price_per_night: enrich?.price_per_night ?? 25000,
    amenities: enrich?.amenities ?? [],
    images,
    featured: enrich?.featured ?? false,
    property_type: or.property_type ?? 'house',
    sqft: or.living_area ?? null,
    sort_order: or.display_order ?? 999,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function humanType(t: string | undefined): string {
  if (!t) return 'home';
  return t.replace(/_/g, ' ');
}

/** Collapse OwnerRez size suffixes (…-Large/-Medium/-Small) to one key so the
 *  same photo at different sizes isn't treated as two distinct images. */
function imageKey(url: string): string {
  return url.replace(/-(?:Large|Medium|Small|Thumbnail|Original)$/i, '');
}

function dedupeImages(urls: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of urls) {
    const key = imageKey(url);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
}
