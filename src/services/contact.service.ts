import { apiRequest } from './http';

/**
 * General contact enquiries — `POST /api/contact`.
 *
 * The Lambda relays the message through SES to the business inbox, with the
 * sender's address as Reply-To so a reply in the mail client reaches the guest
 * rather than the no-reply mailbox.
 *
 * This is NOT the property-booking path: that is `/api/inquiries`, which is
 * scoped to a property and dates and creates a record in OwnerRez.
 */

export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
  /**
   * Honeypot. Rendered off-screen and hidden from assistive tech, so a human
   * never fills it and a bot usually does. The server drops anything with a
   * value here and still answers 200, giving a scraper nothing to learn from.
   */
  company?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(input: ContactInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.name.trim()) errors.name = 'Tell us who you are.';
  if (!input.email.trim()) errors.email = 'We need somewhere to reply.';
  else if (!EMAIL_PATTERN.test(input.email.trim())) errors.email = 'That address looks incomplete.';
  if (!input.message.trim()) errors.message = 'Let us know what you need.';
  return errors;
}

export async function sendContactMessage(
  input: ContactInput,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequest<{ ok: boolean }>('/api/contact', {
    method: 'POST',
    body: {
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || undefined,
      topic: input.topic,
      message: input.message.trim(),
      company: input.company || undefined,
    },
    signal,
    timeoutMs: 20_000,
  });
}
