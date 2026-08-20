import { isSameDay, monthCells, today as todayDate } from '../../lib/dates';
import { formatMonth } from '../../lib/format';
import { cx } from '../../lib/cx';
import styles from './MonthGrid.module.css';

export interface DayPresentation {
  /** Availability state used for colour + strike-through. */
  state: 'open' | 'reserved' | 'held' | 'past' | 'blocked';
  disabled: boolean;
  selected?: boolean;
  inRange?: boolean;
  rangeStart?: boolean;
  rangeEnd?: boolean;
  /** Small secondary line, e.g. a nightly rate. */
  note?: string;
  /** Full accessible label; falls back to the date. */
  label?: string;
}

interface MonthGridProps {
  month: Date;
  describeDay: (date: Date) => DayPresentation;
  onSelect?: (date: Date) => void;
  /** Weekday initials, Sunday first. */
  weekdayLabels?: string[];
}

const DEFAULT_WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * One month of days. Presentation only — every availability and selection rule
 * is decided by `describeDay`, so the same grid backs the reservation calendar
 * and the search date picker without either knowing about the other.
 */
export function MonthGrid({
  month,
  describeDay,
  onSelect,
  weekdayLabels = DEFAULT_WEEKDAYS,
}: MonthGridProps) {
  const cells = monthCells(month);
  const now = todayDate();

  return (
    <div className={styles.month}>
      <p className={styles.caption} aria-hidden="true">
        {formatMonth(month)}
      </p>

      <div className={styles.weekdays} aria-hidden="true">
        {weekdayLabels.map((label, index) => (
          <span className={styles.weekday} key={`${label}-${index}`}>
            {label}
          </span>
        ))}
      </div>

      <div className={styles.days} role="grid" aria-label={formatMonth(month)}>
        {cells.map((date, index) => {
          if (!date) return <span className={styles.pad} key={`pad-${index}`} aria-hidden="true" />;

          const day = describeDay(date);
          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={day.disabled}
              onClick={() => onSelect?.(date)}
              aria-pressed={day.selected ? true : undefined}
              aria-label={day.label ?? date.toDateString()}
              className={cx(
                styles.cell,
                styles[day.state],
                day.inRange && styles.inRange,
                day.rangeStart && styles.rangeStart,
                day.rangeEnd && styles.rangeEnd,
                day.selected && styles.selected,
                isSameDay(date, now) && styles.today,
              )}
            >
              <span className={styles.num}>{date.getDate()}</span>
              {day.note && <span className={styles.rate}>{day.note}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
