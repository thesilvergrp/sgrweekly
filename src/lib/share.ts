import { stayUrl } from './url';

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

/**
 * Share a stay: native share sheet where available, clipboard otherwise.
 * The link is a `?property=<slug>` deep link, which resolves without any server
 * rewrite rule because the path stays `/`.
 */
export async function shareStay(name: string, slugOrId: string): Promise<ShareOutcome> {
  const url = stayUrl(slugOrId);

  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: name, text: `${name} — Silver Group Rentals`, url });
      return 'shared';
    } catch (error) {
      // A cancelled share sheet is a user decision, not a failure.
      if ((error as Error)?.name === 'AbortError') return 'cancelled';
    }
  }

  return copyToClipboard(url) ? 'copied' : 'failed';
}

function copyToClipboard(value: string): boolean {
  if (navigator.clipboard?.writeText) {
    void navigator.clipboard.writeText(value).catch(() => undefined);
    return true;
  }
  return false;
}
