import type { OwnerRezPricingDay } from '../types/ownerrez';
import { apiRequest } from './http';

/**
 * Per-night rates — `GET /api/properties/{id}/pricing?start=&end=`.
 *
 * Both query params are REQUIRED; the proxy answers 400 without them.
 * This routes to the OwnerRez **v1** listings API, which is gated behind a
 * premium OwnerRez feature, so a non-2xx here is expected on some accounts and
 * must never break the page — callers treat rates as strictly optional.
 */
export async function fetchPricing(
  stayId: string,
  startIso: string,
  endIso: string,
  signal?: AbortSignal,
): Promise<OwnerRezPricingDay[]> {
  const result = await apiRequest<OwnerRezPricingDay[]>(
    `/api/properties/${encodeURIComponent(stayId)}/pricing`,
    { signal, query: { start: startIso, end: endIso } },
  );
  return Array.isArray(result) ? result : [];
}
