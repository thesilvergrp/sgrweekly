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

/** Heights outside this range are noise, not a real content measurement. */
const MIN_FRAME_HEIGHT = 240;
const MAX_FRAME_HEIGHT = 20_000;

function clampHeight(value: number): number | null {
  if (!Number.isFinite(value)) return null;
  const height = Math.ceil(value);
  if (height < MIN_FRAME_HEIGHT || height > MAX_FRAME_HEIGHT) return null;
  return height;
}

/**
 * Extracts a content height in CSS pixels from a widget postMessage, or null.
 *
 * WHY THIS EXISTS: the widget page is designed to be resized by OwnerRez's own
 * widget.js, which we deliberately do not load (see the note at the top of this
 * file). The page inside the iframe therefore does not scroll itself — it
 * assumes the embedder grows the frame to fit. Give the iframe a fixed height
 * and everything below it, including the discount code field and the payment
 * button, is simply unreachable.
 *
 * The payload shape is undocumented, so every plausible spelling is accepted.
 * The origin check is the caller's responsibility and is not optional.
 */
export function readHeightMessage(data: unknown): number | null {
  let payload = data;

  if (typeof payload === 'string') {
    const bare = Number(payload);
    if (Number.isFinite(bare)) return clampHeight(bare);

    // Non-JSON string forms such as "height:1234" appear in embed scripts.
    const match = /height["':\s]+(\d+(?:\.\d+)?)/i.exec(payload);
    if (match) return clampHeight(Number(match[1]));

    try {
      payload = JSON.parse(payload);
    } catch {
      return null;
    }
  }

  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;

  for (const key of ['height', 'iframeHeight', 'frameHeight', 'documentHeight', 'scrollHeight', 'or_height']) {
    const raw = record[key];
    const value = typeof raw === 'number' ? raw : typeof raw === 'string' ? Number(raw) : NaN;
    const height = clampHeight(value);
    if (height !== null) return height;
  }

  return null;
}
