import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AvailabilityIndex } from '../../lib/availability';
import { toIsoDate } from '../../lib/dates';
import {
  MAX_WEEKS,
  MIN_WEEKS,
  clampWeeks,
  departureFor,
  maxWeeksFrom,
  nightsForWeeks,
} from '../../lib/stay-rules';
import type { Stay } from '../../types/domain';

export interface ReservationDraft {
  arrival: Date | null;
  weeks: number;
  guests: number;
  pets: number;
  /** Whole weeks that actually fit from the chosen arrival. */
  weeksAvailable: number;
  departure: Date | null;
  nights: number;
  /** True once a valid, conflict-free stay is selected. */
  isComplete: boolean;
  arrivalIso: string | null;
  departureIso: string | null;
  setArrival: (date: Date) => void;
  setWeeks: (weeks: number) => void;
  setGuests: (guests: number) => void;
  setPets: (pets: number) => void;
  clear: () => void;
}

/**
 * Holds the guest's selection and keeps it legal at all times: the arrival must
 * be an open day, the length must be a whole number of weeks that fits before
 * the next closed night, and the party must fit the property.
 */
export function useReservationDraft(
  stay: Stay,
  availability: AvailabilityIndex,
  petsAllowed: boolean,
  maxPets: number,
): ReservationDraft {
  const [arrival, setArrivalDate] = useState<Date | null>(null);
  const [weeks, setWeeksValue] = useState(MIN_WEEKS);
  const [guests, setGuests] = useState(1);
  const [pets, setPets] = useState(0);

  // A different stay, or newly loaded availability, invalidates the selection.
  useEffect(() => {
    setArrivalDate(null);
    setWeeksValue(MIN_WEEKS);
    setGuests(1);
    setPets(0);
  }, [stay.id]);

  useEffect(() => {
    if (!petsAllowed && pets !== 0) setPets(0);
  }, [petsAllowed, pets]);

  useEffect(() => {
    if (guests > stay.capacity.sleeps) setGuests(stay.capacity.sleeps);
  }, [guests, stay.capacity.sleeps]);

  const weeksAvailable = useMemo(
    () => (arrival ? maxWeeksFrom(arrival, availability, MAX_WEEKS) : 0),
    [arrival, availability],
  );

  // Availability can arrive after a date was picked; re-clamp rather than
  // leaving an over-long stay selected.
  useEffect(() => {
    if (!arrival) return;
    if (weeksAvailable === 0) {
      setArrivalDate(null);
      return;
    }
    setWeeksValue((current) => clampWeeks(current, weeksAvailable));
  }, [arrival, weeksAvailable]);

  const setArrival = useCallback(
    (date: Date) => {
      setArrivalDate(date);
      const fits = maxWeeksFrom(date, availability, MAX_WEEKS);
      setWeeksValue(clampWeeks(MIN_WEEKS, fits));
    },
    [availability],
  );

  const setWeeks = useCallback(
    (next: number) => setWeeksValue(clampWeeks(next, weeksAvailable)),
    [weeksAvailable],
  );

  const clear = useCallback(() => {
    setArrivalDate(null);
    setWeeksValue(MIN_WEEKS);
  }, []);

  const departure = arrival && weeksAvailable > 0 ? departureFor(arrival, weeks) : null;
  const isComplete = Boolean(arrival && departure && weeks >= MIN_WEEKS);

  return {
    arrival,
    weeks,
    guests,
    pets: petsAllowed ? Math.min(pets, maxPets) : 0,
    weeksAvailable,
    departure,
    nights: isComplete ? nightsForWeeks(weeks) : 0,
    isComplete,
    arrivalIso: arrival ? toIsoDate(arrival) : null,
    departureIso: departure ? toIsoDate(departure) : null,
    setArrival,
    setWeeks,
    setGuests,
    setPets,
    clear,
  };
}
