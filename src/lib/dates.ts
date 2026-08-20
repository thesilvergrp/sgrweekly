/**
 * Calendar helpers. Everything works in LOCAL time and treats a date as a whole
 * day — never a timestamp. `new Date('2026-09-05')` parses as UTC midnight and
 * can render as the previous day west of Greenwich, so ISO strings are always
 * split manually.
 */

export const MS_PER_DAY = 86_400_000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function today(): Date {
  return startOfDay(new Date());
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Whole days from `a` to `b`; negative when `b` precedes `a`. */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_PER_DAY);
}

/** Date → 'YYYY-MM-DD' in local time. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** 'YYYY-MM-DD' (or a full ISO timestamp) → local midnight, or null. */
export function parseIsoDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('T')[0].split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Sunday-first weekday index of the first cell of a month grid. */
export function leadingBlanks(month: Date): number {
  return new Date(month.getFullYear(), month.getMonth(), 1).getDay();
}

/** The cells of a month grid: leading nulls then every day of the month. */
export function monthCells(month: Date): (Date | null)[] {
  const cells: (Date | null)[] = Array.from({ length: leadingBlanks(month) }, () => null);
  const total = daysInMonth(month);
  for (let day = 1; day <= total; day++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  return cells;
}
