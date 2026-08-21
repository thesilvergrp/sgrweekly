import { useMemo, useState } from 'react';
import { MonthGrid, type DayPresentation } from '../../components/calendar/MonthGrid';
import { Icon } from '../../components/icons';
import { Skeleton } from '../../components/ui/Skeleton';
import type { AvailabilityIndex } from '../../lib/availability';
import { addMonths, daysBetween, firstOfMonth, isSameDay, today } from '../../lib/dates';
import { formatDateWithWeekday, formatMonth, formatMoney } from '../../lib/format';
import { rateOn, type RateTable } from '../../lib/pricing';
import { canArriveOn, departureFor } from '../../lib/stay-rules';
import styles from './AvailabilityCalendar.module.css';

interface AvailabilityCalendarProps {
  availability: AvailabilityIndex;
  loading: boolean;
  arrival: Date | null;
  weeks: number;
  rates: RateTable;
  showRates: boolean;
  onSelectArrival: (date: Date) => void;
  onVisibleMonthChange?: (month: Date) => void;
}

/**
 * Availability calendar for a stay.
 *
 * Booking rule (preserved): stays run in whole weeks with a seven-night
 * minimum. Rather than making the visitor guess a valid check-out, arrival days
 * that cannot fit the minimum stay are disabled outright and the length of stay
 * is chosen separately — so an invalid range can never be constructed.
 */
export function AvailabilityCalendar({
  availability,
  loading,
  arrival,
  weeks,
  rates,
  showRates,
  onSelectArrival,
  onVisibleMonthChange,
}: AvailabilityCalendarProps) {
  const startMonth = firstOfMonth(today());
  const [visibleMonth, setVisibleMonth] = useState(() =>
    firstOfMonth(arrival ?? today()),
  );

  const departure = arrival && weeks > 0 ? departureFor(arrival, weeks) : null;
  const atStart = visibleMonth <= startMonth;

  const move = (delta: number) => {
    const next = addMonths(visibleMonth, delta);
    if (next < startMonth) return;
    setVisibleMonth(next);
    onVisibleMonthChange?.(next);
  };

  const describeDay = useMemo(
    () =>
      (date: Date): DayPresentation => {
        const status = availability.statusOn(date);

        if (status === 'past') {
          return { state: 'past', disabled: true, label: `${formatDateWithWeekday(date)} — in the past` };
        }

        const selected = arrival ? isSameDay(date, arrival) : false;
        const inRange =
          Boolean(arrival && departure) && date > (arrival as Date) && date < (departure as Date);
        const rangeEnd = departure ? isSameDay(date, departure) : false;

        if (status === 'reserved' || status === 'held') {
          return {
            state: status,
            disabled: true,
            label: `${formatDateWithWeekday(date)} — ${status === 'reserved' ? 'booked' : 'unavailable'}`,
          };
        }

        const canArrive = canArriveOn(date, availability);
        const rate = showRates ? rateOn(rates, date) : undefined;

        return {
          state: canArrive || selected || inRange ? 'open' : 'blocked',
          disabled: !canArrive,
          selected,
          inRange: inRange || rangeEnd,
          rangeStart: selected,
          rangeEnd,
          note: rate ? formatMoney(rate, rates.currency) : undefined,
          label: canArrive
            ? `${formatDateWithWeekday(date)} — available${rate ? `, ${formatMoney(rate, rates.currency)} a night` : ''}`
            : `${formatDateWithWeekday(date)} — not enough consecutive nights for a week-long stay`,
        };
      },
    [availability, arrival, departure, rates, showRates],
  );

  if (loading) return <CalendarSkeleton />;

  return (
    <div className={styles.calendar}>
      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => move(-1)}
          disabled={atStart}
          aria-label="Previous month"
        >
          <Icon name="chevronLeft" size={18} />
        </button>
        <span className={styles.navLabel} aria-live="polite">
          {formatMonth(visibleMonth)}
        </span>
        <button
          type="button"
          className={styles.navButton}
          onClick={() => move(1)}
          aria-label="Next month"
        >
          <Icon name="chevronRight" size={18} />
        </button>
      </div>

      <div className={styles.months}>
        <MonthGrid month={visibleMonth} describeDay={describeDay} onSelect={onSelectArrival} />
      </div>

      <p className={styles.status} aria-live="polite">
        {arrival && departure
          ? `${formatDateWithWeekday(arrival)} → ${formatDateWithWeekday(departure)} · ${daysBetween(arrival, departure)} nights`
          : 'Choose an arrival day. Stays run in whole weeks, seven nights minimum.'}
      </p>

      <ul className={styles.legend}>
        <li className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchOpen}`} />
          Available
        </li>
        <li className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchSelected}`} />
          Your stay
        </li>
        <li className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchReserved}`} />
          Booked
        </li>
        <li className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchHeld}`} />
          Unavailable
        </li>
      </ul>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className={styles.loading} aria-busy="true" aria-live="polite">
      <div className={styles.grid7}>
        {Array.from({ length: 35 }, (_, index) => (
          <Skeleton key={index} style={{ aspectRatio: '1', width: '100%' }} />
        ))}
      </div>
      Checking which weeks are open…
    </div>
  );
}
