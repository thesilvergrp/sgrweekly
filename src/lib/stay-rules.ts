import { MIN_NIGHTS, NIGHTS_PER_WEEK } from '../content/policies';
import { addDays, startOfDay, today } from './dates';
import type { AvailabilityIndex } from './availability';

/**
 * The operation books whole weeks with a seven-night minimum. Every date
 * calculation in the booking flow goes through here so the rule cannot drift
 * between the calendar, the reservation panel and the widget handoff.
 */

export const MIN_WEEKS = Math.max(1, Math.ceil(MIN_NIGHTS / NIGHTS_PER_WEEK));
/** Guests can select at most this many weeks in one go through the UI. */
export const MAX_WEEKS = 12;

export function nightsForWeeks(weeks: number): number {
  return weeks * NIGHTS_PER_WEEK;
}

export function departureFor(arrival: Date, weeks: number): Date {
  return addDays(arrival, nightsForWeeks(weeks));
}

/**
 * How many whole weeks fit from `arrival` before the next closed night.
 * Returns 0 when not even the minimum stay fits, which is what makes a day
 * un-selectable as an arrival.
 */
export function maxWeeksFrom(
  arrival: Date,
  availability: AvailabilityIndex,
  ceiling: number = MAX_WEEKS,
): number {
  const start = startOfDay(arrival);
  if (start < today()) return 0;

  let fits = 0;
  for (let weeks = MIN_WEEKS; weeks <= ceiling; weeks++) {
    if (availability.hasConflict(start, departureFor(start, weeks))) break;
    fits = weeks;
  }
  return fits;
}

/** Clamp a requested stay length to what is actually available. */
export function clampWeeks(requested: number, available: number): number {
  if (available <= 0) return 0;
  return Math.min(Math.max(requested, MIN_WEEKS), available);
}

export function canArriveOn(
  date: Date,
  availability: AvailabilityIndex,
): boolean {
  return maxWeeksFrom(date, availability, MIN_WEEKS) >= MIN_WEEKS;
}
