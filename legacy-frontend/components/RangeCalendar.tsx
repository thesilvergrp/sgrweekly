import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RangeCalendarProps {
  /** Check-in date as 'YYYY-MM-DD', or '' if unset. */
  checkIn: string;
  /** Check-out date as 'YYYY-MM-DD', or '' if unset. */
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Parse 'YYYY-MM-DD' as a LOCAL date (avoids the UTC off-by-one of new Date(str)). */
function parseIso(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function firstOfMonth(d: Date, offset = 0): Date {
  return new Date(d.getFullYear(), d.getMonth() + offset, 1);
}

export default function RangeCalendar({ checkIn, checkOut, onChange }: RangeCalendarProps) {
  const today = startOfDay(new Date());
  const start = parseIso(checkIn);
  const end = parseIso(checkOut);

  const [viewMonth, setViewMonth] = useState<Date>(() => firstOfMonth(start ?? today));

  const minMonth = firstOfMonth(today);
  const atMinMonth = viewMonth.getTime() <= minMonth.getTime();

  const goPrev = () => {
    if (!atMinMonth) setViewMonth(firstOfMonth(viewMonth, -1));
  };
  const goNext = () => setViewMonth(firstOfMonth(viewMonth, 1));

  const handlePick = (date: Date) => {
    // Start a fresh range when nothing is selected yet, or when a complete
    // range already exists. Otherwise close the open range as the check-out.
    if (!start || (start && end)) {
      onChange(toIso(date), '');
    } else if (date <= start) {
      onChange(toIso(date), ''); // clicked on/before the start → restart
    } else {
      onChange(toIso(start), toIso(date));
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={goPrev}
        disabled={atMinMonth}
        className="absolute left-0 top-0 w-9 h-9 rounded-full flex items-center justify-center text-silver-100 hover:bg-silver-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors z-10"
        aria-label="Previous month"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={goNext}
        className="absolute right-0 top-0 w-9 h-9 rounded-full flex items-center justify-center text-silver-100 hover:bg-silver-800 transition-colors z-10"
        aria-label="Next month"
      >
        <ChevronRight size={18} />
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <MonthView month={viewMonth} today={today} start={start} end={end} onPick={handlePick} />
        <div className="hidden sm:block">
          <MonthView
            month={firstOfMonth(viewMonth, 1)}
            today={today}
            start={start}
            end={end}
            onPick={handlePick}
          />
        </div>
      </div>
    </div>
  );
}

function MonthView({
  month,
  today,
  start,
  end,
  onPick,
}: {
  month: Date;
  today: Date;
  start: Date | null;
  end: Date | null;
  onPick: (date: Date) => void;
}) {
  const label = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const startWeekday = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }

  return (
    <div>
      <div className="h-9 flex items-center justify-center font-semibold text-silver-50 text-sm">
        {label}
      </div>

      <div className="grid grid-cols-7 mb-1 text-center">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-[11px] font-medium text-silver-300 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 text-center text-sm">
        {cells.map((date, i) => {
          if (!date) return <div key={i} aria-hidden className="h-10" />;

          const isPast = date < today;
          const isStart = !!start && isSameDay(date, start);
          const isEnd = !!end && isSameDay(date, end);
          const inRange = !!start && !!end && date > start && date < end;
          const hasRange = !!start && !!end;

          // The continuous range "bar" lives on the cell; the day circle sits on top.
          let cell = 'relative h-10 flex items-center justify-center';
          if (inRange) cell += ' bg-accent-100';
          else if (isStart && hasRange) cell += ' bg-accent-100 rounded-l-full';
          else if (isEnd) cell += ' bg-accent-100 rounded-r-full';

          let btn = 'w-10 h-10 rounded-full flex items-center justify-center transition-colors';
          if (isStart || isEnd) btn += ' bg-accent-800 text-white font-semibold';
          else if (inRange) btn += ' text-accent-800 font-medium';
          else if (isPast) btn += ' text-silver-300 cursor-not-allowed';
          else btn += ' text-silver-50 hover:bg-accent-50 hover:text-accent-800 cursor-pointer';

          return (
            <div key={i} className={cell}>
              <button
                type="button"
                disabled={isPast}
                onClick={() => onPick(date)}
                className={btn}
                aria-label={date.toDateString()}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
