/**
 * OwnerRez API client — pure, runtime-agnostic. Designed to be lifted into an
 * AWS Lambda handler (Amplify Function) verbatim when we move off the local
 * Vite dev proxy. Reads credentials from process.env at call time so the same
 * code works under Vite's dev server and under Lambda (where env vars are
 * injected from Secrets Manager / SSM).
 *
 * Auth: HTTP Basic with OwnerRez login (email) + Personal Access Token.
 * Base per OwnerRez docs: https://api.ownerrez.com/  (v2 paths under /v2/*).
 * Note: Listings + Reviews endpoints require the "WordPress Plugin +
 * Integrated Websites" premium feature on the OwnerRez account.
 */

const BASE = 'https://api.ownerrez.com/v2';
// Pricing lives on the older v1 listings API.
const BASE_V1 = 'https://api.ownerrez.com/v1';

function authHeader(): string {
  const { username, pat } = creds();
  if (!username || !pat) {
    throw new Error(
      'OwnerRez credentials missing. Set OWNERREZ_USERNAME and OWNERREZ_PAT in silver-group/.env.local (see .env.local.example).'
    );
  }
  return 'Basic ' + Buffer.from(`${username}:${pat}`).toString('base64');
}

/** Returns trimmed credentials so trailing whitespace/newlines from .env can't break auth. */
function creds() {
  return {
    username: (process.env.OWNERREZ_USERNAME ?? '').trim(),
    pat: (process.env.OWNERREZ_PAT ?? '').trim(),
  };
}

/** Non-secret fingerprints for diagnostics. Never returns the actual PAT. */
export function credsFingerprint() {
  const { username, pat } = creds();
  return {
    username,
    usernameLength: username.length,
    patLength: pat.length,
    patPrefix: pat ? pat.slice(0, 2) + '…' : '(empty)',
    patSuffix: pat ? '…' + pat.slice(-2) : '(empty)',
    looksTrimmed: pat === (process.env.OWNERREZ_PAT ?? ''),
  };
}

async function call(path: string, init: RequestInit = {}, base: string = BASE): Promise<unknown> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    Authorization: authHeader(),
    Accept: 'application/json',
    'User-Agent': 'silver-group-dev-proxy/0.1',
    ...((init.headers as Record<string, string>) ?? {}),
  };
  // Only send Content-Type when there's a body — some APIs reject it on GETs.
  if (init.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${base}${path}`, { ...init, method, headers });
  const text = await res.text();
  if (!res.ok) {
    throw new OwnerRezError(res.status, text || res.statusText);
  }
  return text ? JSON.parse(text) : null;
}

export class OwnerRezError extends Error {
  constructor(public status: number, public body: string) {
    super(`OwnerRez ${status}: ${body}`);
    this.name = 'OwnerRezError';
  }
}

/** List all properties. */
export function listProperties(): Promise<unknown> {
  const qs = new URLSearchParams({ active: 'true' });
  return call(`/properties?${qs.toString()}`);
}

/** Full single property record. */
export function getProperty(id: string | number): Promise<unknown> {
  return call(`/properties/${encodeURIComponent(String(id))}`);
}

/**
 * Property listings with full marketing payload — descriptions, photos,
 * amenities, room/bathroom details. Requires the "WordPress Plugin +
 * Integrated Websites" premium feature on the OwnerRez account.
 */
export function listListings(): Promise<unknown> {
  const qs = new URLSearchParams({
    includeAmenities: 'true',
    includeRooms: 'true',
    includeBathrooms: 'true',
    includeImages: 'true',
    includeDescriptions: 'true',
  });
  return call(`/listings?${qs.toString()}`);
}

/** Full single listing record. */
export function getListing(id: string | number): Promise<unknown> {
  const qs = new URLSearchParams({ descriptionFormat: 'html' });
  return call(`/listings/${encodeURIComponent(String(id))}?${qs.toString()}`);
}

/**
 * Per-property reservations + owner blocks in a window. Used to grey out booked
 * weeks. Supports OwnerRez pagination via optional `offset`/`limit` so callers
 * can page through every result.
 */
export function listBookings(
  propertyId: string | number,
  sinceUtcIso: string,
  offset?: number,
  limit?: number,
): Promise<unknown> {
  const qs = new URLSearchParams({
    property_ids: String(propertyId),
    since_utc: sinceUtcIso,
  });
  if (offset !== undefined) qs.set('offset', String(offset));
  if (limit !== undefined) qs.set('limit', String(limit));
  return call(`/bookings?${qs.toString()}`);
}

/** Quotes for a property — used to fetch real per-week pricing. */
export function listQuotes(propertyId: string | number): Promise<unknown> {
  const qs = new URLSearchParams({ property_ids: String(propertyId) });
  return call(`/quotes?${qs.toString()}`);
}

/**
 * Per-night pricing for a listing in a date window (v1 listings API). Returns
 * one entry per date with the nightly `amount`. `listingId` is the same id as
 * the property id.
 */
export function listPricing(
  listingId: string | number,
  startIso: string,
  endIso: string,
): Promise<unknown> {
  const qs = new URLSearchParams({
    includePricingRules: 'true',
    start: startIso,
    end: endIso,
  });
  return call(`/listings/${encodeURIComponent(String(listingId))}/pricing?${qs.toString()}`, {}, BASE_V1);
}

/**
 * Reviews for a property. Requires the "WordPress Plugin + Integrated
 * Websites" premium feature on the OwnerRez account.
 */
export function listReviews(propertyId: string | number): Promise<unknown> {
  const qs = new URLSearchParams({
    property_id: String(propertyId),
    active: 'true',
  });
  return call(`/reviews?${qs.toString()}`);
}

/**
 * Submit a guest booking inquiry. Payload shape per OwnerRez v2 docs —
 * exact field names may need tweaking after first live POST; tighten with
 * the actual API response shape.
 */
export interface InquiryPayload {
  property_id: number;
  arrival: string; // YYYY-MM-DD
  departure: string; // YYYY-MM-DD
  adults: number;
  children?: number;
  pets?: number;
  guest: {
    first_name: string;
    last_name: string;
    email_address: string;
    phone?: string;
  };
  notes?: string;
}

export function createInquiry(payload: InquiryPayload): Promise<unknown> {
  return call('/inquiries', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
