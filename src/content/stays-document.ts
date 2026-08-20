import { stayContent } from './stay-content';

/**
 * The editable per-stay editorial document.
 *
 * Kept SEPARATE from the site-copy document because it is roughly fifty times
 * larger: page copy is a few kilobytes and changes rarely, while stay editorial
 * runs to a couple of hundred kilobytes and changes whenever a property is
 * onboarded or re-photographed. Two documents means editing a heading does not
 * rewrite every property description, and the small document can be cached
 * harder than the big one.
 *
 * The bundled `stay-content.ts` remains the base layer and the offline
 * fallback; this document is an OVERLAY applied on top of it at render time.
 * That is deliberate — if S3 or the proxy is unreachable the catalog still
 * renders from the repo rather than going blank.
 */

/** Editable fields for one stay. Keyed by OwnerRez property id. */
export interface StayEditorial {
  displayName?: string;
  summary?: string;
  story?: string;
  amenityTags?: string[];
  photos?: string[];
  /** Shows the "guest favourite" badge on the card. */
  spotlight?: boolean;
  /** Sleeping capacity in beds — OwnerRez does not publish this. */
  bedCount?: number;
  /** Only used when OwnerRez has no living_area for the property. */
  areaSqFt?: number | null;
}

export interface StaysContentDocument {
  version: number;
  updatedAt?: string;
  stays: Record<string, StayEditorial>;
}

export const STAYS_CONTENT_VERSION = 1;

/**
 * The bundled catalog expressed as an overlay document — the seed for the
 * content store and the starting values for the admin editor.
 */
export function buildDefaultStaysDocument(): StaysContentDocument {
  const stays: Record<string, StayEditorial> = {};
  for (const entry of stayContent) {
    stays[entry.ownerRezId] = {
      displayName: entry.displayName,
      summary: entry.summary,
      story: entry.story,
      amenityTags: entry.amenityTags,
      photos: entry.photos,
      spotlight: entry.spotlight,
      bedCount: entry.bedCount,
      areaSqFt: entry.areaSqFt,
    };
  }
  return { version: STAYS_CONTENT_VERSION, stays };
}

/** Empty overlay — what renders before any remote document arrives. */
export const emptyStaysDocument: StaysContentDocument = {
  version: STAYS_CONTENT_VERSION,
  stays: {},
};
