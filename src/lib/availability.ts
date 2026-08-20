import type { BlockedSpan, DayAvailability } from '../types/domain';
import type { OwnerRezBooking } from '../types/ownerrez';
import { parseIsoDate, startOfDay } from './dates';

/**
 * Availability, derived from OwnerRez reservations and owner blocks.
 *
 * Rules dictated by the backend data (docs/api-inventory.md §3.2):
 *   • anything whose status begins with "cancel" is ignored — this matches both
 *     the American "canceled" and the British "cancelled";
 *   • each remaining record closes the HALF-OPEN span [arrival, departure):
 *     the departure day is a turnover day and stays bookable;
 *   • `is_block: true` (owner block) and `is_block: false` (guest reservation)
 *     both close nights; a reservation is the stronger signal when they overlap.
 *
 * Implementation: spans are split by reason, sorted by start, and given a
 * prefix-maximum of their end dates. That makes both "is this day closed?" and
 * "does this range collide?" O(log n) without ever expanding a span into days —
 * multi-year owner blocks are common and enumerating them would be wasteful.
 */

function isCancelled(status: string | undefined): boolean {
  return (status ?? '').trim().toLowerCase().startsWith('cancel');
}

export function buildBlockedSpans(bookings: OwnerRezBooking[]): BlockedSpan[] {
  const spans: BlockedSpan[] = [];
  for (const booking of bookings) {
    if (isCancelled(booking.status)) continue;
    const start = parseIsoDate(booking.arrival);
    const end = parseIsoDate(booking.departure);
    if (!start || !end || end <= start) continue;
    spans.push({ start, end, reason: booking.is_block ? 'held' : 'reserved' });
  }
  return spans;
}

interface SpanIndex {
  starts: number[];
  ends: number[];
  /** ends[0..i] running maximum, so one binary search answers coverage. */
  maxEnd: number[];
}

function indexSpans(spans: BlockedSpan[]): SpanIndex {
  const sorted = [...spans].sort((a, b) => a.start.getTime() - b.start.getTime());
  const starts: number[] = [];
  const ends: number[] = [];
  const maxEnd: number[] = [];
  let running = Number.NEGATIVE_INFINITY;

  for (const span of sorted) {
    const start = span.start.getTime();
    const end = span.end.getTime();
    running = Math.max(running, end);
    starts.push(start);
    ends.push(end);
    maxEnd.push(running);
  }
  return { starts, ends, maxEnd };
}

/** Index of the last entry whose start is < `limit`, or -1. */
function lastStartBefore(index: SpanIndex, limit: number): number {
  let low = 0;
  let high = index.starts.length - 1;
  let found = -1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (index.starts[mid] < limit) {
      found = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return found;
}

function covers(index: SpanIndex, dayMs: number): boolean {
  const last = lastStartBefore(index, dayMs + 1); // start <= day
  return last >= 0 && index.maxEnd[last] > dayMs;
}

function collides(index: SpanIndex, startMs: number, endMs: number): boolean {
  if (endMs <= startMs) return false;
  const last = lastStartBefore(index, endMs); // start < end
  return last >= 0 && index.maxEnd[last] > startMs;
}

export interface AvailabilityIndex {
  /** True when there is nothing to check — availability could not be loaded. */
  readonly isEmpty: boolean;
  /** Status of a single rendered day. */
  statusOn(date: Date): DayAvailability;
  /** True if any night in [start, end) is closed. Back-to-back turnovers are
   *  NOT a collision: one stay's departure may be the next stay's arrival. */
  hasConflict(start: Date, end: Date): boolean;
}

export function createAvailabilityIndex(spans: BlockedSpan[]): AvailabilityIndex {
  const reserved = indexSpans(spans.filter((span) => span.reason === 'reserved'));
  const held = indexSpans(spans.filter((span) => span.reason === 'held'));
  const startOfToday = startOfDay(new Date()).getTime();

  return {
    isEmpty: spans.length === 0,
    statusOn(date: Date): DayAvailability {
      const day = startOfDay(date).getTime();
      if (day < startOfToday) return 'past';
      if (covers(reserved, day)) return 'reserved';
      if (covers(held, day)) return 'held';
      return 'open';
    },
    hasConflict(start: Date, end: Date): boolean {
      const from = startOfDay(start).getTime();
      const to = startOfDay(end).getTime();
      return collides(reserved, from, to) || collides(held, from, to);
    },
  };
}
