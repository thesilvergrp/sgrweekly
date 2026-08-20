import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { dateStatus, rangeHasConflict, type UnavailableInterval } from '../lib/availability';

interface BookingCalendarProps {
  checkIn: Date | null;
  checkOut: Date | null;
  /** Emits the new (checkIn, checkOut) pair; checkOut is null until a valid range is chosen. */
  onChange: (checkIn: Date | null, checkOut: Date | null) => void;
  /** Unavailable [arrival, departure) intervals from bookings + owner blocks. */
  intervals?: UnavailableInterval[];
  /** While true, show a loading state instead of the grid (data still paging). */
  loading?: boolean;
  /** Minimum stay length in nights. Defaults to 7. */
  minNights?: number;
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function nightsBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86_400_000);
}

const WEEK = 7;

export default function BookingCalendar({
  checkIn,
  checkOut,
  onChange,
  intervals = [],
  loading = false,
  minNights = 7,
}: BookingCalendarProps) {
  const today = startOfDay(new Date());
  const initialMonth = checkIn
    ? new Date(checkIn.getFullYear(), checkIn.getMonth(), 1)
    : new Date(today.getFullYear(), today.getMonth(), 1);
  const [viewMonth, setViewMonth] = useState<Date>(initialMonth);

  // Don't render a selectable calendar until every bookings page is merged.
  if (loading) {
    return (
      <div className="py-10 flex flex-col items-center justify-center gap-2 text-silver-300 text-sm">
        <div className="w-5 h-5 border-2 border-silver-600 border-t-accent-800 rounded-full animate-spin" />
        Checking availability…
      </div>
    );
  }

  const monthLabel = viewMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const startWeekday = viewMonth.getDay();
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
  }

  const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const atMinMonth = viewMonth.getTime() <= minMonth.getTime();
  const goPrev = () => {
    if (!atMinMonth) setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };
  const goNext = () => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));

  const minWeeks = Math.max(1, Math.ceil(minNights / WEEK));

  const handlePick = (date: Date) => {
    // Start (or restart) a range.
    if (!checkIn || (checkIn && checkOut) || date <= checkIn) {
      onChange(date, null);
      return;
    }
    // Choosing the check-out: stays are booked in whole weeks, so snap to the
    // nearest week count, then shrink to the largest whole-week stay that fits
    // before any blocked/booked date (never below the minimum).
    let weeks = Math.max(minWeeks, Math.round(nightsBetween(checkIn, date) / WEEK));
    let co = addDays(checkIn, weeks * WEEK);
    while (weeks >= minWeeks && rangeHasConflict(checkIn, co, intervals)) {
      weeks -= 1;
      co = addDays(checkIn, weeks * WEEK);
    }
    if (weeks < minWeeks) {
      onChange(date, null); // no room for even the minimum stay — restart here
      return;
    }
    onChange(checkIn, co);
  };

  const selectedNights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const selectedWeeks = selectedNights / WEEK;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={atMinMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-silver-100 hover:bg-silver-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="font-semibold text-silver-50 text-sm">{monthLabel}</div>
        <button
          type="button"
          onClick={goNext}
          className="w-8 h-8 rounded-full flex items-center justify-center text-silver-100 hover:bg-silver-800 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1.5 text-center">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-[11px] font-semibold py-1 text-silver-300">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-sm">
        {cells.map((date, i) => {
          if (!date) return <div key={i} aria-hidden />;

          const isPast = date < today;
          const status = dateStatus(date, intervals); // 'block' | 'booking' | null
          const isUnavailable = status !== null;
          const isCheckIn = !!checkIn && isSameDay(date, checkIn);
          const isCheckOut = !!checkOut && isSameDay(date, checkOut);
          const inRange = !!checkIn && !!checkOut && date > checkIn && date < checkOut;
          const selectable = !isPast && !isUnavailable;

          let cls = 'aspect-square flex items-center justify-center rounded-full text-sm transition-colors';
          if (isPast) {
            cls += ' text-silver-400 cursor-not-allowed';
          } else if (isCheckIn || isCheckOut) {
            cls += ' bg-accent-800 text-white font-semibold';
          } else if (inRange) {
            cls += ' bg-accent-100 text-accent-800';
          } else if (isUnavailable) {
            cls +=
              status === 'booking'
                ? ' text-red-400 line-through cursor-not-allowed'
                : ' text-silver-400 line-through cursor-not-allowed bg-silver-800/50';
          } else {
            cls += ' text-silver-50 font-medium hover:bg-accent-50 hover:text-accent-800 cursor-pointer';
          }

          return (
            <button
              key={i}
              type="button"
              disabled={!selectable}
              onClick={() => handlePick(date)}
              className={cls}
              aria-label={`${date.toDateString()}${
                isUnavailable ? ` — ${status === 'booking' ? 'booked' : 'blocked'}` : ''
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-silver-300 text-xs leading-relaxed">
        {checkIn && !checkOut
          ? 'Select a check-out date — stays are booked in whole weeks.'
          : selectedWeeks > 0
          ? `${selectedWeeks} ${selectedWeeks === 1 ? 'week' : 'weeks'} · ${selectedNights} nights selected.`
          : `Pick any check-in day. Stays are booked in whole-week increments (${minNights}-night minimum).`}
      </p>

      {intervals.length > 0 && (
        <div className="mt-3 flex items-center gap-4 text-[11px] text-silver-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-silver-800/50 border border-silver-600" />
            Blocked
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400" />
            Booked
          </span>
        </div>
      )}
    </div>
  );
}

export { nightsBetween };
