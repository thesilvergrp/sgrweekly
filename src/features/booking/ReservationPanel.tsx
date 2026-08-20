import { useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { tableStyles } from '../../components/ui/tableStyles';
import { Notice } from '../../components/ui/Notice';
import { Stepper } from '../../components/ui/Stepper';
import { formatDateLong, formatMoney, pluralise } from '../../lib/format';
import { quoteStay, type RateTable } from '../../lib/pricing';
import { MAX_WEEKS, MIN_WEEKS } from '../../lib/stay-rules';
import type { AvailabilityIndex } from '../../lib/availability';
import type { Stay, StayPolicies } from '../../types/domain';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import type { ReservationDraft } from './useReservationDraft';
import { cx } from '../../lib/cx';
import styles from './ReservationPanel.module.css';

interface ReservationPanelProps {
  stay: Stay;
  policies: StayPolicies;
  draft: ReservationDraft;
  availability: AvailabilityIndex;
  availabilityLoading: boolean;
  availabilityDegraded: boolean;
  rates: RateTable;
  ratesAvailable: boolean;
  onReserve: () => void;
  onEnquire: () => void;
  onVisibleMonthChange: (month: Date) => void;
  /** Renders without its own frame — used inside the mobile sheet. */
  bare?: boolean;
}

export function ReservationPanel({
  stay,
  policies,
  draft,
  availability,
  availabilityLoading,
  availabilityDegraded,
  rates,
  ratesAvailable,
  onReserve,
  onEnquire,
  onVisibleMonthChange,
  bare = false,
}: ReservationPanelProps) {
  const quote = useMemo(
    () => (draft.arrival && draft.isComplete ? quoteStay(rates, draft.arrival, draft.nights) : null),
    [rates, draft.arrival, draft.isComplete, draft.nights],
  );

  return (
    <div className={cx(styles.panel, bare && styles.bare)}>
      <div className={styles.head}>
        <h2 className={styles.title}>Check availability</h2>
        {ratesAvailable && rates.from !== null && (
          <p className={styles.fromRate}>
            from <strong>{formatMoney(rates.from, rates.currency)}</strong> a night
          </p>
        )}
      </div>

      {availabilityDegraded && (
        <Notice tone="warning" title="Live calendar unavailable">
          We could not reach the booking system, so these dates are not confirmed. Send an enquiry
          and we will check by hand.
        </Notice>
      )}

      <AvailabilityCalendar
        availability={availability}
        loading={availabilityLoading}
        arrival={draft.arrival}
        weeks={draft.weeks}
        rates={rates}
        showRates={ratesAvailable}
        onSelectArrival={draft.setArrival}
        onVisibleMonthChange={onVisibleMonthChange}
      />

      <div className={styles.dates}>
        <div className={styles.dateCell}>
          <span className={styles.dateLabel}>Arrive</span>
          <span className={cx(styles.dateValue, !draft.arrival && styles.dateEmpty)}>
            {draft.arrival ? formatDateLong(draft.arrival) : 'Pick a day'}
          </span>
        </div>
        <div className={styles.dateCell}>
          <span className={styles.dateLabel}>Depart</span>
          <span className={cx(styles.dateValue, !draft.departure && styles.dateEmpty)}>
            {draft.departure ? formatDateLong(draft.departure) : '—'}
          </span>
        </div>
      </div>

      <div className={styles.controls}>
        <Stepper
          label="Length of stay"
          caption={
            draft.arrival
              ? `Up to ${pluralise(draft.weeksAvailable, 'week')} free from this date`
              : 'Whole weeks only, seven nights minimum'
          }
          value={draft.weeks}
          min={MIN_WEEKS}
          max={draft.weeksAvailable || MAX_WEEKS}
          disabled={!draft.arrival}
          onChange={draft.setWeeks}
          formatValue={(value) => pluralise(value, 'week')}
        />

        <div className={styles.controlDivider}>
          <Stepper
            label="Guests"
            caption={`This home sleeps ${stay.capacity.sleeps}`}
            value={draft.guests}
            min={1}
            max={stay.capacity.sleeps}
            onChange={draft.setGuests}
            formatValue={(value) => pluralise(value, 'guest')}
          />
        </div>

        {policies.petsAllowed && (
          <div className={styles.controlDivider}>
            <Stepper
              label="Pets"
              caption={`Up to ${policies.maxPets} welcome here`}
              value={draft.pets}
              min={0}
              max={policies.maxPets}
              onChange={draft.setPets}
              formatValue={(value) => pluralise(value, 'pet')}
            />
          </div>
        )}
      </div>

      {quote && (
        <DataTable caption="Estimated cost">
          <tr>
            <th scope="row">
              {formatMoney(quote.averageNightly, rates.currency)} × {pluralise(quote.nights, 'night')}
            </th>
            <td className={tableStyles.numeric}>{formatMoney(quote.subtotal, rates.currency)}</td>
          </tr>
          <tr className={tableStyles.total}>
            <th scope="row">Estimated total</th>
            <td className={tableStyles.numeric}>{formatMoney(quote.subtotal, rates.currency)}</td>
          </tr>
        </DataTable>
      )}

      <div className={styles.actions}>
        <Button size="lg" block disabled={!draft.isComplete} onClick={onReserve}>
          {draft.isComplete ? 'Reserve these dates' : 'Choose your dates'}
        </Button>
        <Button variant="quiet" block disabled={!draft.isComplete} onClick={onEnquire}>
          Ask about these dates
        </Button>
        {draft.arrival && (
          <Button variant="link" size="sm" className={styles.clear} onClick={draft.clear}>
            Clear dates
          </Button>
        )}
      </div>

      <p className={styles.footnote}>
        {quote
          ? `${quote.complete ? 'Rates shown are current' : 'Some nights are not yet priced'} — taxes and fees are confirmed at checkout. Nothing is charged until you book.`
          : 'Nothing is charged until you book. Final pricing is confirmed at checkout.'}
      </p>
    </div>
  );
}
