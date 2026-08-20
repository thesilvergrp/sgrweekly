import type { OwnerRezInquiryBody } from '../types/ownerrez';
import { apiRequest } from './http';

/**
 * `POST /api/inquiries` — creates an inquiry in OwnerRez through the proxy.
 *
 * The proxy answers 400 unless property_id, arrival, departure,
 * guest.first_name and guest.email_address are all present, so the same rule is
 * enforced here before the round trip. The payload shape is exactly the one the
 * existing backend defines (docs/api-inventory.md §3.3).
 *
 * NOTE: per DEPLOY.md this endpoint has not been verified against a live
 * OwnerRez POST. It is the SECONDARY path; the primary booking flow is the
 * OwnerRez widget handoff, which is unchanged.
 */

export interface EnquiryInput {
  stayId: string;
  /** YYYY-MM-DD */
  arrival: string;
  /** YYYY-MM-DD */
  departure: string;
  fullName: string;
  email: string;
  phone?: string;
  guests: number;
  pets?: number;
  message?: string;
}

export class EnquiryValidationError extends Error {
  readonly fields: Record<string, string>;
  constructor(fields: Record<string, string>) {
    super('Inquiry is missing required fields');
    this.name = 'EnquiryValidationError';
    this.fields = fields;
  }
}

/** "Jane Anne Smith" → { first: "Jane", last: "Anne Smith" }. */
export function splitFullName(value: string): { first: string; last: string } {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEnquiry(input: EnquiryInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const { first } = splitFullName(input.fullName);

  if (!input.stayId) errors.stayId = 'Choose a property.';
  if (!input.arrival) errors.arrival = 'Choose an arrival date.';
  if (!input.departure) errors.departure = 'Choose a departure date.';
  if (!first) errors.fullName = 'Tell us your name.';
  if (!input.email.trim()) errors.email = 'We need an email address to reply to.';
  else if (!EMAIL_PATTERN.test(input.email.trim())) errors.email = 'That email address looks incomplete.';

  return errors;
}

export function toInquiryBody(input: EnquiryInput): OwnerRezInquiryBody {
  const { first, last } = splitFullName(input.fullName);
  return {
    property_id: Number(input.stayId),
    arrival: input.arrival,
    departure: input.departure,
    adults: input.guests,
    pets: input.pets,
    guest: {
      first_name: first,
      last_name: last,
      email_address: input.email.trim(),
      phone: input.phone?.trim() || undefined,
    },
    notes: input.message?.trim() || undefined,
  };
}

export async function submitEnquiry(input: EnquiryInput, signal?: AbortSignal): Promise<void> {
  const errors = validateEnquiry(input);
  if (Object.keys(errors).length > 0) throw new EnquiryValidationError(errors);

  await apiRequest<unknown>('/api/inquiries', {
    method: 'POST',
    body: toInquiryBody(input),
    signal,
  });
}
