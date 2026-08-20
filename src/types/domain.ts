/**
 * Application domain model. This is the only shape UI code is allowed to see —
 * the OwnerRez wire types stop at the service layer (services/stay-mapper.ts).
 */

export interface StayAddress {
  /** "Atlanta, GA" */
  locality: string;
  /** Full postal address, when the live API is reachable. */
  full: string;
  latitude?: number;
  longitude?: number;
}

export interface StayCapacity {
  bedrooms: number;
  beds: number;
  bathrooms: number;
  sleeps: number;
  areaSqFt: number | null;
}

export interface Stay {
  /** OwnerRez property id, as a string. Join key for content, deep links and
   *  the booking widget. */
  id: string;
  name: string;
  /** URL slug used by the ?property= deep link. */
  slug: string;
  summary: string;
  story: string;
  kind: string;
  address: StayAddress;
  capacity: StayCapacity;
  amenities: string[];
  photos: string[];
  spotlight: boolean;
  /** Ascending display order. */
  order: number;
  /** Where the operational facts came from. */
  source: 'live' | 'offline';
}

/** A closed-off span of nights, `[start, end)` — end is a turnover day. */
export interface BlockedSpan {
  start: Date;
  /** Exclusive. */
  end: Date;
  reason: 'reserved' | 'held';
}

export type DayAvailability = 'open' | 'reserved' | 'held' | 'past';

/** Result of resolving policy content for one stay. */
export interface StayPolicies {
  cancellation: string;
  petsAllowed: boolean;
  maxPets: number;
  checkInFrom: string;
  checkOutBy: string;
  houseRules: PolicyGroup[];
  headline: PolicyRule[];
  safety: string[];
}

export interface PolicyGroup {
  title: string;
  rules: PolicyRule[];
}

export type PolicyTone = 'allowed' | 'not-allowed' | 'capacity' | 'timing';

export interface PolicyRule {
  label: string;
  tone: PolicyTone;
}

/** A selected stay: arrival plus a whole number of weeks. */
export interface StayDraft {
  arrival: Date;
  /** Whole weeks; the backend rule is a 7-night minimum in weekly increments. */
  weeks: number;
  guests: number;
  pets: number;
}
