import { useMemo } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { addDays, addMonths, firstOfMonth, toIsoDate } from '../../lib/dates';
import { buildRateTable, type RateTable } from '../../lib/pricing';
import { fetchPricing } from '../../services/pricing.service';

const EMPTY: RateTable = { byDate: new Map(), currency: 'USD', isEmpty: true, from: null };

/**
 * Nightly rates for the months currently on screen.
 *
 * Rates are a progressive enhancement: the endpoint proxies OwnerRez's v1
 * listings API, which is gated behind a premium feature. Any failure resolves
 * to an empty table and the UI simply says pricing is confirmed at booking —
 * it never guesses a number.
 */
export function useStayPricing(stayId: string, visibleMonth: Date, monthsVisible = 2) {
  const start = useMemo(() => firstOfMonth(visibleMonth), [visibleMonth]);
  const end = useMemo(
    () => addDays(firstOfMonth(addMonths(start, monthsVisible + 1)), -1),
    [start, monthsVisible],
  );

  const { data, status } = useAsync(
    (signal) => fetchPricing(stayId, toIsoDate(start), toIsoDate(end), signal),
    [stayId, toIsoDate(start), toIsoDate(end)],
  );

  const rates = useMemo(() => (data ? buildRateTable(data) : EMPTY), [data]);

  return {
    rates,
    isLoading: status === 'loading',
    /** True when the backend cannot price this stay — hide all rate UI. */
    unavailable: status === 'error' || (status === 'success' && rates.isEmpty),
  };
}
