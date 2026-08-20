import { useCallback, useEffect, useState } from 'react';
import { STAY_PARAM, homeUrl, readStayParam, relativeStayUrl } from '../lib/url';

/**
 * The app's routing contract, preserved from the deployed site: a stay is
 * addressed by `?property=<slug|id>` on `/`.
 *
 * Why a query parameter and not a path: Amplify Hosting has no SPA fallback
 * rewrite configured, so only `/` is guaranteed to serve index.html. Moving to
 * `/stays/<slug>` would require adding a `/<*> → /index.html` rewrite — an
 * infrastructure change, and out of scope (see docs/api-inventory.md §4).
 *
 * What changed: the previous implementation read the parameter once and then
 * deleted it, so the detail view had no address and Back skipped it. Here the
 * parameter stays in the URL and navigation goes through pushState/popstate, so
 * Back, Forward, refresh and copy-link all behave.
 */
export function useStayRoute() {
  const [slug, setSlug] = useState<string | null>(() => readStayParam());

  useEffect(() => {
    const onPopState = () => setSlug(readStayParam());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openStay = useCallback((slugOrId: string) => {
    if (readStayParam() === slugOrId) return;
    window.history.pushState({ [STAY_PARAM]: slugOrId }, '', relativeStayUrl(slugOrId));
    setSlug(slugOrId);
  }, []);

  const closeStay = useCallback(() => {
    if (readStayParam() === null) return;
    window.history.pushState({}, '', homeUrl());
    setSlug(null);
  }, []);

  return { slug, openStay, closeStay };
}
