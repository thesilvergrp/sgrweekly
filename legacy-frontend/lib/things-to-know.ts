import type { Property } from './types';

// "Things to know" content (cancellation policy, house rules, safety), keyed by
// OwnerRez property id so it works for both live and static catalogs. Most
// rules are identical across the portfolio, so they live here as constants;
// only the cancellation policy and pet policy vary per property.

const POLICY_60 =
  'Full refund for cancellations made at least 60 days before arrival. No refund for cancellations within 60 days of arrival.';
const POLICY_30 =
  'Full refund for cancellations made at least 30 days before arrival. No refund for cancellations within 30 days of arrival.';
const POLICY_TIERED_30_14 =
  'Full refund for cancellations made more than 30 days before arrival; 50% refund for cancellations made more than 14 days before arrival.';
const POLICY_30_PARTIAL =
  'Full refund for cancellations made more than 30 days before arrival.';
const POLICY_NONE = 'No refunds.';

// Defaults to the standard 30-day policy when an id isn't listed here.
const CANCELLATION_BY_ID: Record<string, string> = {
  '393226': POLICY_60, // The Silver Oasis
  '414368': POLICY_60, // Silver Springs
  '422491': POLICY_60, // The Silver Chateau
  '458085': POLICY_TIERED_30_14, // The Silver Manor
  '408496': POLICY_30_PARTIAL, // The Silver Bungalow
  '404235': POLICY_NONE, // The Silver Benz
};

// Properties that accept pets (everything else is pet-free).
const PETS_ALLOWED_IDS = new Set<string>([
  '451644', // The Silver Chic Studio
]);

export const CHECK_IN_TIME = '4:00 PM';
export const CHECK_OUT_TIME = '11:00 AM';
/** Max pets selectable when a property allows them. */
export const MAX_PETS = 2;

/** Drives the icon shown beside a rule. */
export type RuleTone = 'yes' | 'no' | 'guests' | 'clock';

export interface Rule {
  label: string;
  tone: RuleTone;
}

export interface RuleGroup {
  title: string;
  rules: Rule[];
}

export interface ThingsToKnow {
  cancellationPolicy: string;
  petsAllowed: boolean;
  maxGuests: number;
  checkIn: string;
  checkOut: string;
  /** Full grouped rules, shown in the "Read more" modal. */
  ruleGroups: RuleGroup[];
  /** Short flat list shown on the card before "Read more". */
  rulesPreview: Rule[];
  safety: string[];
}

export function getThingsToKnow(property: Property): ThingsToKnow {
  const petsAllowed = PETS_ALLOWED_IDS.has(property.id);
  const maxGuests = property.max_guests;

  const children: Rule = { label: 'Children welcome (2–12 years).', tone: 'yes' };
  const infants: Rule = { label: 'Infants welcome (under 2).', tone: 'yes' };
  const guests: Rule = { label: `Maximum ${maxGuests} guests.`, tone: 'guests' };
  const pets: Rule = {
    label: petsAllowed ? 'Pets allowed.' : 'No pets allowed.',
    tone: petsAllowed ? 'yes' : 'no',
  };
  const events: Rule = { label: 'No parties or events.', tone: 'no' };
  const smoking: Rule = { label: 'Smoking is not allowed indoors.', tone: 'no' };
  const checkInRule: Rule = { label: `Check-in after ${CHECK_IN_TIME}.`, tone: 'clock' };
  const checkOutRule: Rule = { label: `Check-out before ${CHECK_OUT_TIME}.`, tone: 'clock' };

  return {
    cancellationPolicy: CANCELLATION_BY_ID[property.id] ?? POLICY_30,
    petsAllowed,
    maxGuests,
    checkIn: CHECK_IN_TIME,
    checkOut: CHECK_OUT_TIME,
    ruleGroups: [
      { title: 'Number and age of guests', rules: [children, infants, guests] },
      { title: 'Pets', rules: [pets] },
      { title: 'Events', rules: [events] },
      { title: 'Smoking', rules: [smoking] },
      { title: 'Check-in & check-out', rules: [checkInRule, checkOutRule] },
    ],
    rulesPreview: [children, infants, pets, events],
    safety: [
      `Maximum occupancy: ${maxGuests} guests`,
      'No parties or events',
      'No smoking anywhere indoors',
    ],
  };
}
