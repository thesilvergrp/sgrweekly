import type { Stay } from '../types/domain';

/** Display formatting. No business logic lives here. */

const dayMonth = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const dayMonthYear = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const weekdayLong = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});
const monthYear = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });

export const formatDate = (date: Date) => dayMonth.format(date);
export const formatDateLong = (date: Date) => dayMonthYear.format(date);
export const formatDateWithWeekday = (date: Date) => weekdayLong.format(date);
export const formatMonth = (date: Date) => monthYear.format(date);

export function formatMoney(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatWeeks(weeks: number): string {
  return pluralise(weeks, 'week');
}

/** "2 bedrooms · 2 baths · sleeps 6" */
export function describeCapacity(stay: Stay): string {
  const parts = [
    describeBedrooms(stay.capacity.bedrooms),
    pluralise(stay.capacity.bathrooms, 'bath'),
    `sleeps ${stay.capacity.sleeps}`,
  ];
  return parts.join(' · ');
}

/** "Studio" | "1 bedroom" | "4 bedrooms" — used on cards, facts and summaries. */
export function describeBedrooms(bedrooms: number): string {
  if (bedrooms === 0) return 'Studio';
  return pluralise(bedrooms, 'bedroom');
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}
