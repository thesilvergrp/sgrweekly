/**
 * OwnerRez v2 API response shapes — only the fields we actually consume.
 * Captured from a real /api/properties/lookup response on 2026-05-29.
 */

export interface OwnerRezAddress {
  id: number;
  is_default: boolean;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

export interface OwnerRezProperty {
  id: number;
  key: string;
  /** Internal name (often a short slug like "Detroit", "Walker"). */
  name: string;
  /** Public-facing name shown on the marketing site. Prefer this when present. */
  external_name?: string;
  active: boolean;
  is_snoozed: boolean;
  property_type?: string;
  address: OwnerRezAddress;
  bedrooms: number;
  bathrooms: number;
  bathrooms_full: number;
  bathrooms_half: number;
  max_guests: number;
  max_adults?: number;
  max_children?: number;
  max_pets: number;
  living_area?: number;
  living_area_type?: string;
  latitude: number;
  longitude: number;
  check_in: string;
  check_out: string;
  currency_code: string;
  display_order?: number;
  owner_id?: number;
  thumbnail_url?: string;
  thumbnail_url_large?: string;
  thumbnail_url_medium?: string;
}

/**
 * One day from /v1/listings/{id}/pricing. `amount` is the nightly rate (in the
 * listing's currency, as a plain number) for that date.
 */
export interface PricingDay {
  date: string; // 'YYYY-MM-DD'
  amount: number;
  minNights: number;
  isArrivalDisallowed: boolean;
  isDepartureDisallowed: boolean;
  isStayDisallowed: boolean;
}

export interface OwnerRezListResponse<T> {
  count: number;
  items: T[];
  limit: number;
  offset: number;
  /** Present when more pages remain; follow it (or offset+limit) to paginate. */
  next_page_url?: string;
}

/**
 * A reservation OR an owner block from /v2/bookings. `is_block` distinguishes
 * the two; both make their [arrival, departure) nights unavailable unless the
 * booking is canceled.
 */
export interface OwnerRezBooking {
  id: number;
  property_id: number;
  arrival: string; // 'YYYY-MM-DD'
  departure: string; // 'YYYY-MM-DD' (checkout/turnover day — stays available)
  /** true = owner-created block; false = a real guest booking. */
  is_block: boolean;
  /** e.g. "Active", "Booked", "Canceled". */
  status?: string;
}
