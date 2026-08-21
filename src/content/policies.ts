import type { StayDefaults } from './site-content';
import type { StayEditorial } from './stays-document';
import type { PolicyGroup, PolicyRule, StayPolicies } from '../types/domain';

/**
 * Stay policy content, keyed by OwnerRez property id.
 *
 * Business data preserved from the existing operation: the per-property
 * cancellation terms, which properties accept pets, the check-in/check-out
 * windows and the pet ceiling. Everything else in this module is a new
 * implementation.
 */

const CANCELLATION = {
  days60:
    'Full refund for cancellations made at least 60 days before arrival. No refund inside 60 days.',
  days30:
    'Full refund for cancellations made at least 30 days before arrival. No refund inside 30 days.',
  tiered30then14:
    'Full refund more than 30 days before arrival; 50% refund more than 14 days before arrival.',
  days30Partial: 'Full refund for cancellations made more than 30 days before arrival.',
  none: 'This stay is non-refundable once booked.',
} as const;

/** Properties that deviate from the standard 30-day policy. */
const CANCELLATION_BY_STAY_ID: Record<string, string> = {
  '393226': CANCELLATION.days60, // The Silver Oasis
  '414368': CANCELLATION.days60, // Silver Springs
  '422491': CANCELLATION.days60, // The Silver Chateau
  '458085': CANCELLATION.tiered30then14, // The Silver Manor
  '408496': CANCELLATION.days30Partial, // The Silver Bungalow
  '404235': CANCELLATION.none, // The Silver Benz
};

/** The only stays that accept pets. Everything else is pet-free. */
const PET_FRIENDLY_STAY_IDS = new Set<string>([
  '451644', // The Silver Chic Studio
]);

export const CHECK_IN_FROM = '4:00 PM';
export const CHECK_OUT_BY = '11:00 AM';
export const MAX_PETS = 2;

/** Booking rule enforced by the operation: whole weeks, 7-night minimum. */
export const MIN_NIGHTS = 7;
export const NIGHTS_PER_WEEK = 7;

/**
 * Resolves the terms shown on a stay page.
 *
 * Precedence: the property's own editable values, then the site-wide editable
 * defaults, then the tables in this file. The tables remain the last resort so
 * the site still shows correct terms when no content document is reachable.
 */
export function resolveStayPolicies(
  stayId: string,
  sleeps: number,
  overrides?: StayEditorial,
  defaults?: StayDefaults,
): StayPolicies {
  const petsAllowed = overrides?.petsAllowed ?? PET_FRIENDLY_STAY_IDS.has(stayId);
  const maxPets = overrides?.maxPets ?? defaults?.maxPets ?? MAX_PETS;
  const checkInFrom = defaults?.checkInFrom ?? CHECK_IN_FROM;
  const checkOutBy = defaults?.checkOutBy ?? CHECK_OUT_BY;
  const cancellation =
    overrides?.cancellationPolicy ??
    CANCELLATION_BY_STAY_ID[stayId] ??
    defaults?.cancellationPolicy ??
    CANCELLATION.days30;

  const children: PolicyRule = { label: 'Children (2–12) welcome', tone: 'allowed' };
  const infants: PolicyRule = { label: 'Infants under 2 welcome', tone: 'allowed' };
  const capacity: PolicyRule = { label: `Sleeps up to ${sleeps} guests`, tone: 'capacity' };
  const pets: PolicyRule = petsAllowed
    ? { label: `Up to ${maxPets} pets welcome`, tone: 'allowed' }
    : { label: 'No pets', tone: 'not-allowed' };
  const events: PolicyRule = { label: 'No parties or events', tone: 'not-allowed' };
  const smoking: PolicyRule = { label: 'No smoking indoors', tone: 'not-allowed' };
  const arrive: PolicyRule = { label: `Check in from ${checkInFrom}`, tone: 'timing' };
  const depart: PolicyRule = { label: `Check out by ${checkOutBy}`, tone: 'timing' };

  const houseRules: PolicyGroup[] = [
    { title: 'Who can stay', rules: [capacity, children, infants] },
    { title: 'Pets', rules: [pets] },
    { title: 'Gatherings', rules: [events] },
    { title: 'Smoking', rules: [smoking] },
    { title: 'Arrival and departure', rules: [arrive, depart] },
  ];

  return {
    cancellation,
    petsAllowed,
    maxPets,
    checkInFrom,
    checkOutBy,
    houseRules,
    headline: [capacity, pets, events, smoking],
    safety: [
      `Maximum occupancy is ${sleeps} guests`,
      'No parties or events at any property',
      'No smoking anywhere indoors',
    ],
  };
}
