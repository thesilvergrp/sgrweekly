import type { PricingDay } from './ownerrez-types';

// Turns the per-night pricing feed into a lookup and sums a stay. Stays are
// priced as the sum of each night's `amount` (dynamic pricing), with a flat
// fallback for any night the feed doesn't cover.

export type PriceMap = Map<string, number>;

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function buildPriceMap(days: PricingDay[]): PriceMap {
  const map: PriceMap = new Map();
  for (const d of days) {
    if (typeof d.amount === 'number' && Number.isFinite(d.amount)) {
      map.set(d.date, d.amount);
    }
  }
  return map;
}

/** Sum the nightly rates for `nights` nights starting at `start`. */
export function priceForStay(
  map: PriceMap,
  start: Date,
  nights: number,
  fallbackNightly: number,
): number {
  let total = 0;
  for (let i = 0; i < nights; i++) {
    total += map.get(toIso(addDays(start, i))) ?? fallbackNightly;
  }
  return total;
}
