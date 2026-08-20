/**
 * Wire types for the OwnerRez payloads that reach the browser through the
 * /api/* proxy (AWS Lambda in production, Vite middleware in development).
 *
 * These mirror the backend contract exactly and must not be "improved" —
 * field names, casing and nullability are dictated by OwnerRez.
 * See docs/api-inventory.md §3.
 */

/** Envelope returned by every OwnerRez list endpoint. */
export interface OwnerRezPage<T> {
  count: number;
  items: T[];
  limit: number;
  offset: number;
  /** Present while more pages remain. */
  next_page_url?: string;
}

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

/** `GET /api/properties`, `GET /api/properties/{id}`. */
export interface OwnerRezProperty {
  id: number;
  key: string;
  /** Internal short name. */
  name: string;
  /** Public-facing name; preferred for display when present. */
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
 * `GET /api/properties/{id}/bookings` — a guest reservation OR an owner block.
 * `[arrival, departure)` is half-open: the departure day is a turnover day and
 * stays bookable as somebody else's arrival.
 */
export interface OwnerRezBooking {
  id: number;
  property_id: number;
  /** YYYY-MM-DD */
  arrival: string;
  /** YYYY-MM-DD — checkout day, still available. */
  departure: string;
  /** true = owner-created block, false = real guest reservation. */
  is_block: boolean;
  /** e.g. "Active", "Booked", "Canceled"/"Cancelled". */
  status?: string;
}

/** `GET /api/properties/{id}/pricing` — one entry per date (OwnerRez v1 API). */
export interface OwnerRezPricingDay {
  /** YYYY-MM-DD */
  date: string;
  /** Nightly rate as a plain number in the listing currency. */
  amount: number;
  minNights: number;
  isArrivalDisallowed: boolean;
  isDepartureDisallowed: boolean;
  isStayDisallowed: boolean;
}

/**
 * `POST /api/inquiries` body. The proxy rejects the request with 400 unless
 * property_id, arrival, departure, guest.first_name and guest.email_address
 * are all present — mirrored client-side in services/enquiry.service.ts.
 */
export interface OwnerRezInquiryBody {
  property_id: number;
  /** YYYY-MM-DD */
  arrival: string;
  /** YYYY-MM-DD */
  departure: string;
  adults: number;
  children?: number;
  pets?: number;
  guest: {
    first_name: string;
    last_name: string;
    email_address: string;
    phone?: string;
  };
  notes?: string;
}

/** `GET /api/health`. */
export interface ApiHealth {
  ok: boolean;
  hasCredentials: boolean;
}
