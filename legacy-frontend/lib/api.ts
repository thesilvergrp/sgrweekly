import type { Property } from './types';
import type { OwnerRezListResponse, OwnerRezProperty, OwnerRezBooking, PricingDay } from './ownerrez-types';
import { mapOwnerRezProperty } from './ownerrez-mapper';

/**
 * Hits the local Vite dev proxy (or the deployed Amplify Function — same path)
 * which fronts OwnerRez. Throws on non-2xx so callers can decide whether to
 * fall back to static data.
 */
export async function fetchProperties(): Promise<Property[]> {
  const res = await fetch('/api/properties');
  if (!res.ok) {
    throw new Error(`/api/properties returned ${res.status}`);
  }
  const data = (await res.json()) as OwnerRezListResponse<OwnerRezProperty>;
  return data.items
    .filter((p) => p.active && !p.is_snoozed)
    .map(mapOwnerRezProperty)
    .sort((a, b) => a.sort_order - b.sort_order);
}

// Availability lookups want every active reservation/block regardless of when
// it was created, so we look back generously. (OwnerRez `since_utc` filters by
// last-modified time, not by stay dates.)
const BOOKINGS_SINCE = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 2).toISOString();

/**
 * Fetch ALL bookings (real reservations + owner blocks) for a property,
 * following pagination until every page is merged. Callers must not render
 * availability until this resolves (see STEP 4).
 *
 * NOTE: the /api proxy (server/ + lambda/, intentionally out of scope here)
 * currently forwards only `since`, not `offset`/`limit`. We still send
 * offset/limit and follow `next_page_url`/`count`, so this paginates correctly
 * the moment the proxy forwards them. Until then it returns a single page, and
 * the `returnedOffset !== offset` guard stops us from re-collecting page 0 if
 * the proxy ignores `offset`.
 */
export async function fetchAllBookings(propertyId: string | number): Promise<OwnerRezBooking[]> {
  const all: OwnerRezBooking[] = [];
  const limit = 100;
  let offset = 0;

  for (let page = 0; page < 50; page++) {
    const qs = new URLSearchParams({
      since: BOOKINGS_SINCE,
      offset: String(offset),
      limit: String(limit),
    });
    const res = await fetch(
      `/api/properties/${encodeURIComponent(String(propertyId))}/bookings?${qs.toString()}`,
    );
    if (!res.ok) {
      throw new Error(`/api/properties/${propertyId}/bookings returned ${res.status}`);
    }
    const data = (await res.json()) as OwnerRezListResponse<OwnerRezBooking>;
    const items = data.items ?? [];
    const returnedOffset = data.offset ?? offset;

    // Server ignored our offset (gave a different page than requested) → stop
    // rather than re-collecting the same items forever.
    if (page > 0 && returnedOffset !== offset) break;

    all.push(...items);

    const total = data.count ?? all.length;
    const fetched = returnedOffset + items.length;
    const hasMore = Boolean(data.next_page_url) || fetched < total;
    if (!hasMore || items.length === 0) break;

    if (fetched <= offset) break; // no forward progress — bail out
    offset = fetched;
  }

  // De-dupe by id in case a non-paginating proxy echoed overlapping pages.
  return Array.from(new Map(all.map((b) => [b.id, b])).values());
}

/**
 * Per-night pricing for a property between two ISO dates (inclusive start,
 * inclusive end), from the v1 listings pricing API via the /api proxy.
 */
export async function fetchPricing(
  propertyId: string | number,
  startIso: string,
  endIso: string,
): Promise<PricingDay[]> {
  const qs = new URLSearchParams({ start: startIso, end: endIso });
  const res = await fetch(
    `/api/properties/${encodeURIComponent(String(propertyId))}/pricing?${qs.toString()}`,
  );
  if (!res.ok) {
    throw new Error(`/api/properties/${propertyId}/pricing returned ${res.status}`);
  }
  return (await res.json()) as PricingDay[];
}

export interface InquiryInput {
  propertyId: string | number;
  arrival: string; // YYYY-MM-DD
  departure: string; // YYYY-MM-DD
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestCount: number;
  pets?: number;
  notes?: string;
}

/** Splits "Jane Anne Smith" → { first: "Jane", last: "Anne Smith" }. */
function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

export async function submitInquiry(input: InquiryInput): Promise<void> {
  const { first, last } = splitName(input.guestName);
  const payload = {
    property_id: Number(input.propertyId),
    arrival: input.arrival,
    departure: input.departure,
    adults: input.guestCount,
    pets: input.pets,
    guest: {
      first_name: first,
      last_name: last,
      email_address: input.guestEmail,
      phone: input.guestPhone,
    },
    notes: input.notes,
  };

  const res = await fetch('/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Inquiry submit failed (${res.status}): ${text}`);
  }
}
