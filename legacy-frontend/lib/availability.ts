import type { OwnerRezBooking } from './ownerrez-types';

// Pure availability logic for the booking calendar. Given the bookings/blocks
// from /v2/bookings, this turns them into half-open [arrival, departure)
// intervals and answers "is this date unavailable?" without ever enumerating
// the days of a (possibly multi-year) block.

export type DateStatus = 'block' | 'booking' | null;

export interface UnavailableInterval {
  /** Arrival — first unavailable night (INCLUSIVE). */
  start: Date;
  /** Departure — checkout/turnover day (EXCLUSIVE; stays open for a new arrival). */
  end: Date;
  /** true = owner block, false = real guest booking. */
  isBlock: boolean;
}

/** Parse 'YYYY-MM-DD' (or a full ISO string) as a LOCAL date at midnight. */
function parseDateOnly(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('T')[0].split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Matches "canceled" and the British "cancelled". */
function isCanceled(status: string | undefined): boolean {
  return (status ?? '').trim().toLowerCase().startsWith('cancel');
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * STEP 1 + STEP 2: drop canceled items, then turn each remaining booking/block
 * into a half-open [arrival, departure) interval. Both `is_block: true` (owner
 * blocks) and `is_block: false` (real bookings) make their nights unavailable;
 * the departure day itself is left open (turnover/checkout day).
 */
export function buildUnavailableIntervals(bookings: OwnerRezBooking[]): UnavailableInterval[] {
  const intervals: UnavailableInterval[] = [];
  for (const b of bookings) {
    if (isCanceled(b.status)) continue;
    const start = parseDateOnly(b.arrival);
    const end = parseDateOnly(b.departure);
    if (!start || !end || end <= start) continue;
    intervals.push({ start, end, isBlock: Boolean(b.is_block) });
  }
  return intervals;
}

/**
 * STEP 5: for a single rendered date, check whether it falls inside any active
 * [arrival, departure) interval — cheap even for multi-year spans, since we
 * test the date against each interval instead of expanding the interval.
 *
 * Returns 'booking' over 'block' when both overlap (a real reservation is the
 * stronger signal), or null when the date is open.
 */
export function dateStatus(date: Date, intervals: UnavailableInterval[]): DateStatus {
  const day = startOfDay(date);
  let block = false;
  for (const iv of intervals) {
    if (day >= iv.start && day < iv.end) {
      if (!iv.isBlock) return 'booking';
      block = true;
    }
  }
  return block ? 'block' : null;
}

/**
 * True if any night in the half-open range [start, end) is unavailable. Used to
 * forbid starting a stay on a week that overlaps a block or booking. Two
 * half-open intervals overlap iff `start < iv.end && iv.start < end`, which
 * naturally allows back-to-back turnovers (one stay's departure == the next
 * stay's arrival is NOT a conflict).
 */
export function rangeHasConflict(
  start: Date,
  end: Date,
  intervals: UnavailableInterval[],
): boolean {
  const s = startOfDay(start);
  const e = startOfDay(end);
  for (const iv of intervals) {
    if (s < iv.end && iv.start < e) return true;
  }
  return false;
}
