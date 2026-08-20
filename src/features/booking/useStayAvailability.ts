import { useMemo } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { buildBlockedSpans, createAvailabilityIndex, type AvailabilityIndex } from '../../lib/availability';
import { fetchBookings } from '../../services/availability.service';

export interface StayAvailability {
  index: AvailabilityIndex;
  isLoading: boolean;
  /** True when availability could not be loaded — dates are shown as open, and
   *  the visitor is told the calendar is provisional rather than misled. */
  degraded: boolean;
  error: unknown;
  reload: () => void;
}

/**
 * Loads every reservation and owner block for one stay, following pagination
 * before anything becomes selectable. On failure the calendar degrades to
 * "everything open" — matching the previous behaviour — but the degradation is
 * now visible in the UI.
 */
export function useStayAvailability(stayId: string): StayAvailability {
  const { data, status, error, reload } = useAsync(
    (signal) => fetchBookings(stayId, signal),
    [stayId],
  );

  const index = useMemo(
    () => createAvailabilityIndex(buildBlockedSpans(data ?? [])),
    [data],
  );

  return {
    index,
    isLoading: status === 'loading',
    degraded: status === 'error',
    error: status === 'error' ? error : undefined,
    reload,
  };
}
