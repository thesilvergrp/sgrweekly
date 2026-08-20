import type { StayEditorial } from '../content/stays-document';
import type { Stay } from '../types/domain';

/**
 * Applies editorial overrides from the content document onto mapped stays.
 *
 * This runs at render time, not fetch time, so changing copy never triggers a
 * second `/api/properties` round trip and the overlay stays a pure function of
 * (stays, overrides).
 *
 * Only EDITORIAL fields can be overridden. Operational facts — address, geo,
 * bed/bath counts, sleeps, living area, display order — remain owned by
 * OwnerRez and are deliberately not overridable here: letting a content
 * document contradict the booking system is how a guest ends up booking a
 * property that does not fit their party.
 */
export function overlayStayContent(
  stays: Stay[],
  overrides: Record<string, StayEditorial>,
): Stay[] {
  if (!stays.length || Object.keys(overrides).length === 0) return stays;

  return stays.map((stay) => {
    const override = overrides[stay.id];
    if (!override) return stay;

    return {
      ...stay,
      name: override.displayName ?? stay.name,
      summary: override.summary ?? stay.summary,
      story: override.story ?? stay.story,
      amenities: override.amenityTags ?? stay.amenities,
      photos: override.photos ?? stay.photos,
      spotlight: override.spotlight ?? stay.spotlight,
      capacity: {
        ...stay.capacity,
        beds: override.bedCount ?? stay.capacity.beds,
        // OwnerRez `living_area` wins when it has one; the override only fills
        // the gap, so the content document can never contradict the system of
        // record on a fact a guest might book against.
        areaSqFt: stay.capacity.areaSqFt ?? override.areaSqFt ?? null,
      },
      // `slug` is intentionally NOT derived from an overridden display name:
      // it is part of the ?property= deep-link contract and shared links must
      // keep resolving after a rename.
    };
  });
}
