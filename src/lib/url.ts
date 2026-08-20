/**
 * URL contract helpers.
 *
 * PRESERVED: the OwnerRez booking handoff bounces the guest back with transient
 * `or_*` query parameters. The app renders at `/` and navigates by query
 * parameter, so those would otherwise stick in the address bar forever. They
 * are stripped before first paint with replaceState (no history entry).
 */

export const STAY_PARAM = 'property';
/** Presence of ?admin switches to the content editor. */
export const ADMIN_PARAM = 'admin';

export function stripTransientParams(): void {
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('or_')) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (changed) {
    window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
  }
}

/** Reads ?property=<slug|id> — the deep-link contract shared links depend on. */
export function readStayParam(search: string = window.location.search): string | null {
  const value = new URLSearchParams(search).get(STAY_PARAM);
  return value && value.trim() ? value.trim() : null;
}

/** Canonical URL for a stay: `/?property=<slug>`, preserving other params. */
export function stayUrl(slugOrId: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set(STAY_PARAM, slugOrId);
  url.hash = '';
  return url.toString();
}

/** True when the current URL asks for the admin editor. */
export function isAdminRoute(search: string = window.location.search): boolean {
  return new URLSearchParams(search).has(ADMIN_PARAM);
}

/** The home URL, with the stay parameter removed. */
export function homeUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.delete(STAY_PARAM);
  return url.pathname + (url.search || '') + url.hash;
}

export function relativeStayUrl(slugOrId: string): string {
  const url = new URL(stayUrl(slugOrId));
  return url.pathname + url.search;
}
