import { ApiError } from '../services/http';

export interface FriendlyError {
  title: string;
  body: string;
  /** Raw detail, shown behind a disclosure for diagnostics. */
  detail?: string;
  canRetry: boolean;
}

/**
 * Turns a thrown value into something a visitor can read.
 *
 * The proxy preserves OwnerRez's status code, so a 401/403 means the SERVER's
 * OwnerRez credentials are wrong — never anything the visitor did. The copy
 * reflects that rather than implying the visitor is unauthorised.
 */
export function describeError(error: unknown): FriendlyError {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case 'network':
        return {
          title: 'We could not reach our booking service',
          body: 'Check your connection and try again. You can still browse the homes below.',
          detail: error.message,
          canRetry: true,
        };
      case 'timeout':
        return {
          title: 'That took longer than expected',
          body: 'Our booking service is slow to respond right now. Try again in a moment.',
          detail: error.message,
          canRetry: true,
        };
      case 'credentials':
        return {
          title: 'Live data is temporarily unavailable',
          body: 'Our connection to the booking system needs attention. Nothing is wrong on your end — call or email us and we will confirm availability directly.',
          detail: error.message,
          canRetry: true,
        };
      case 'server':
        return {
          title: 'Our booking service hit an error',
          body: 'This is on us. Try again shortly, or get in touch and we will sort it out for you.',
          detail: error.message,
          canRetry: true,
        };
      case 'parse':
        return {
          title: 'We received an unexpected response',
          body: 'Try again, and let us know if it keeps happening.',
          detail: error.message,
          canRetry: true,
        };
      case 'client':
      default:
        return {
          title: 'That request could not be completed',
          body: error.detail || 'Please check the details and try again.',
          detail: error.message,
          canRetry: error.status !== 400,
        };
    }
  }

  return {
    title: 'Something went wrong',
    body: 'Try again, or contact us and we will help directly.',
    detail: error instanceof Error ? error.message : String(error),
    canRetry: true,
  };
}
