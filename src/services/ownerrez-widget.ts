/**
 * OwnerRez booking-widget handoff — the production payment path.
 *
 * PRESERVED VERBATIM from the working integration (docs/api-inventory.md §4.5).
 * Three details here are load-bearing and must not be "tidied":
 *
 *  1. The widget is embedded as a DIRECT iframe URL, not through widget.js.
 *     widget.js appends a `referrer` param that OwnerRez answers with 403 on
 *     domains that are not allow-listed.
 *  2. The property is selected with `or_propertyId` — the numeric OwnerRez
 *     property id. It is NOT `propertyKey`, which is a different GUID.
 *  3. On submit the iframe does not navigate itself. It postMessages
 *     `{ url }` to the parent and expects the parent to navigate the TOP
 *     window. Skip that and the widget hangs on "Redirecting to checkout…".
 */

const WIDGET_ID = 'a607f72c561749baa59066d916909564';
export const OWNERREZ_WIDGET_ORIGIN = 'https://app.ownerrez.com';

export interface WidgetHandoff {
  stayId: string;
  /** YYYY-MM-DD */
  arrival: string;
  /** YYYY-MM-DD */
  departure: string;
  guests: number;
  pets?: number;
}

export function buildWidgetUrl({ stayId, arrival, departure, guests, pets }: WidgetHandoff): string {
  const params = new URLSearchParams();
  params.set('or_propertyId', stayId);
  params.set('or_arrival', arrival);
  params.set('or_departure', departure);
  params.set('or_guests', String(guests));
  params.set('or_adults', String(guests));
  if (pets && pets > 0) params.set('or_pets', String(pets));
  return `${OWNERREZ_WIDGET_ORIGIN}/widgets/${WIDGET_ID}?${params.toString()}`;
}

/**
 * Extracts the checkout URL from a widget postMessage, or null if the message
 * is not one. The origin check is the caller's responsibility and is not
 * optional.
 */
export function readCheckoutMessage(data: unknown): string | null {
  let payload = data;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return null;
    }
  }
  if (payload && typeof payload === 'object' && 'url' in payload) {
    const url = (payload as { url: unknown }).url;
    if (typeof url === 'string' && url.startsWith('https://')) return url;
  }
  return null;
}
