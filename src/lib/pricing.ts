import type { OwnerRezPricingDay } from '../types/ownerrez';
import { addDays, toIsoDate } from './dates';

/**
 * Nightly rates from the OwnerRez v1 pricing feed.
 *
 * Rates are strictly optional: the endpoint sits behind a premium OwnerRez
 * feature and may be unavailable, in which case nothing here is rendered and
 * the visitor is told that pricing is confirmed at booking. Nothing in this
 * module ever invents a rate for a night the feed did not price.
 */

export interface RateTable {
  /** 'YYYY-MM-DD' → nightly amount. */
  byDate: Map<string, number>;
  currency: string;
  isEmpty: boolean;
  /** Cheapest priced night in the loaded window, or null. */
  from: number | null;
}

export function buildRateTable(days: OwnerRezPricingDay[], currency = 'USD'): RateTable {
  const byDate = new Map<string, number>();
  for (const day of days) {
    if (typeof day.amount === 'number' && Number.isFinite(day.amount) && day.amount > 0) {
      byDate.set(day.date, day.amount);
    }
  }
  const amounts = [...byDate.values()];
  return {
    byDate,
    currency,
    isEmpty: byDate.size === 0,
    from: amounts.length > 0 ? Math.min(...amounts) : null,
  };
}

export interface StayQuote {
  nights: number;
  /** Nights the feed actually priced. */
  pricedNights: number;
  subtotal: number;
  averageNightly: number;
  /** True when every night of the stay had a published rate. */
  complete: boolean;
}

/** Sums published rates across a stay. Never extrapolates missing nights. */
export function quoteStay(table: RateTable, arrival: Date, nights: number): StayQuote | null {
  if (table.isEmpty || nights <= 0) return null;

  let subtotal = 0;
  let pricedNights = 0;
  for (let offset = 0; offset < nights; offset++) {
    const amount = table.byDate.get(toIsoDate(addDays(arrival, offset)));
    if (amount === undefined) continue;
    subtotal += amount;
    pricedNights += 1;
  }
  if (pricedNights === 0) return null;

  return {
    nights,
    pricedNights,
    subtotal,
    averageNightly: subtotal / pricedNights,
    complete: pricedNights === nights,
  };
}

export function rateOn(table: RateTable, date: Date): number | undefined {
  return table.byDate.get(toIsoDate(date));
}
