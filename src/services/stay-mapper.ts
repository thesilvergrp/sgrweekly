import { stayContentById, type StayContent } from '../content/stay-content';
import { describeBedrooms } from '../lib/format';
import type { Stay } from '../types/domain';
import type { OwnerRezProperty } from '../types/ownerrez';

/**
 * Merges the OwnerRez operational record with the repo-managed editorial
 * content into the domain `Stay` the UI consumes.
 *
 * Join key is the OwnerRez id (never the name): ids are immutable, while
 * `external_name` can be edited in OwnerRez at any time.
 */

const STATE_ABBREVIATIONS: Record<string, string> = {
  Georgia: 'GA',
  Alabama: 'AL',
  Florida: 'FL',
  Tennessee: 'TN',
  'South Carolina': 'SC',
  'North Carolina': 'NC',
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function titleCase(value: string): string {
  return value.toLowerCase().replace(/\b[a-z]/g, (char) => char.toUpperCase());
}

function abbreviateState(state: string): string {
  return STATE_ABBREVIATIONS[state] ?? state;
}

/**
 * OwnerRez serves the same photo at several sizes with a `-Large`/`-Medium`
 * suffix. Collapse those so a cover photo that also appears in the gallery is
 * not shown twice.
 */
function photoIdentity(url: string): string {
  return url.replace(/-(?:Large|Medium|Small|Thumbnail|Original)$/i, '');
}

function mergePhotos(...groups: (string[] | undefined)[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const group of groups) {
    for (const url of group ?? []) {
      if (!url) continue;
      const key = photoIdentity(url);
      if (seen.has(key)) continue;
      seen.add(key);
      output.push(url);
    }
  }
  return output;
}

function humaniseKind(kind: string | undefined): string {
  if (!kind) return 'home';
  return kind.replace(/_/g, ' ').toLowerCase();
}

/** Live OwnerRez record + repo content → domain Stay. */
export function toStay(record: OwnerRezProperty): Stay {
  const name = record.external_name?.trim() || record.name;
  const content = stayContentById.get(String(record.id));

  const state = abbreviateState(record.address.state);
  const locality = `${record.address.city}, ${state}`;
  const full = [
    record.address.street1,
    record.address.street2,
    `${record.address.city}, ${state} ${record.address.postal_code}`,
    titleCase(record.address.country ?? ''),
  ]
    .filter(Boolean)
    .join(', ');

  const cover =
    record.thumbnail_url_large ?? record.thumbnail_url ?? record.thumbnail_url_medium ?? undefined;

  return {
    id: String(record.id),
    name,
    slug: content?.slug ?? slugify(name),
    summary:
      content?.summary ??
      `${describeBedrooms(record.bedrooms)} · ${record.bathrooms} bath · sleeps ${record.max_guests}.`,
    story:
      content?.story ??
      `${name} is a ${humaniseKind(record.property_type)} in ${locality}, sleeping up to ${record.max_guests} guests.`,
    kind: humaniseKind(record.property_type),
    address: {
      locality,
      full,
      latitude: Number.isFinite(record.latitude) ? record.latitude : undefined,
      longitude: Number.isFinite(record.longitude) ? record.longitude : undefined,
    },
    capacity: {
      bedrooms: record.bedrooms,
      beds: content?.bedCount ?? Math.max(record.bedrooms, 1),
      bathrooms: record.bathrooms,
      sleeps: record.max_guests,
      areaSqFt: record.living_area ?? content?.areaSqFt ?? null,
    },
    amenities: content?.amenityTags ?? [],
    photos: mergePhotos(cover ? [cover] : [], content?.photos),
    spotlight: content?.spotlight ?? false,
    order: record.display_order ?? content?.listingOrder ?? 999,
    source: 'live',
  };
}

/** Repo content only — used when /api/properties cannot be reached. */
export function toOfflineStay(content: StayContent): Stay {
  const locality = `${content.offline.locality}, ${content.offline.region}`;
  return {
    id: content.ownerRezId,
    name: content.displayName,
    slug: content.slug,
    summary: content.summary,
    story: content.story,
    kind: humaniseKind(content.offline.kind),
    address: { locality, full: locality },
    capacity: {
      bedrooms: content.offline.bedrooms,
      beds: content.bedCount,
      bathrooms: content.offline.bathrooms,
      sleeps: content.offline.sleeps,
      areaSqFt: content.areaSqFt,
    },
    amenities: content.amenityTags,
    photos: content.photos,
    spotlight: content.spotlight,
    order: content.listingOrder,
    source: 'offline',
  };
}
