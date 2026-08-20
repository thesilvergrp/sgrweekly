import type { OwnerRezBooking, OwnerRezPage } from '../types/ownerrez';
import { apiRequest } from './http';

/**
 * Reservations and owner blocks for one property.
 *
 * `since_utc` filters by LAST-MODIFIED time, not by stay dates, so the window
 * has to be generous or recently-unmodified future bookings disappear. Two
 * years back is the value the operation has been running with. Preserved.
 */
const MODIFIED_SINCE_WINDOW_MS = 1000 * 60 * 60 * 24 * 365 * 2;
const PAGE_SIZE = 100;
const MAX_PAGES = 50;

export async function fetchBookings(
  stayId: string,
  signal?: AbortSignal,
): Promise<OwnerRezBooking[]> {
  const since = new Date(Date.now() - MODIFIED_SINCE_WINDOW_MS).toISOString();
  const collected: OwnerRezBooking[] = [];
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await apiRequest<OwnerRezPage<OwnerRezBooking>>(
      `/api/properties/${encodeURIComponent(stayId)}/bookings`,
      { signal, query: { since, offset, limit: PAGE_SIZE } },
    );

    const items = result.items ?? [];
    const servedOffset = result.offset ?? offset;

    // The deployed Lambda forwards `since` but not `offset`/`limit`. If it hands
    // back a page we did not ask for, stop rather than collecting page 0 forever.
    if (page > 0 && servedOffset !== offset) break;

    collected.push(...items);

    const total = result.count ?? collected.length;
    const consumed = servedOffset + items.length;
    const more = Boolean(result.next_page_url) || consumed < total;

    if (!more || items.length === 0 || consumed <= offset) break;
    offset = consumed;
  }

  // De-duplicate in case a non-paginating proxy echoed overlapping pages.
  return Array.from(new Map(collected.map((booking) => [booking.id, booking])).values());
}
