import { stayContent } from '../content/stay-content';
import type { Stay } from '../types/domain';
import type { OwnerRezPage, OwnerRezProperty } from '../types/ownerrez';
import { apiRequest } from './http';
import { toOfflineStay, toStay } from './stay-mapper';

/**
 * Catalog access. `GET /api/properties` → OwnerRezPage<OwnerRezProperty>.
 *
 * Backend-derived rules preserved verbatim:
 *   • only `active === true` and `is_snoozed === false` records are shown;
 *   • ordering is by OwnerRez `display_order`, ascending.
 */
export async function fetchStays(signal?: AbortSignal): Promise<Stay[]> {
  const page = await apiRequest<OwnerRezPage<OwnerRezProperty>>('/api/properties', { signal });
  return (page.items ?? [])
    .filter((record) => record.active && !record.is_snoozed)
    .map(toStay)
    .sort(byOrderThenName);
}

/** Single property record — `GET /api/properties/{id}`. */
export async function fetchStay(id: string, signal?: AbortSignal): Promise<Stay> {
  const record = await apiRequest<OwnerRezProperty>(
    `/api/properties/${encodeURIComponent(id)}`,
    { signal },
  );
  return toStay(record);
}

/** The repo catalog, rendered when the live API is unreachable. */
export function offlineStays(): Stay[] {
  return stayContent.map(toOfflineStay).sort(byOrderThenName);
}

function byOrderThenName(a: Stay, b: Stay): number {
  return a.order - b.order || a.name.localeCompare(b.name);
}
