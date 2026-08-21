import { useEffect, useMemo, useRef, useState } from 'react';
import { useSiteContent, useStaysContent } from '../../app/content-context';
import { useAsync } from '../../hooks/useAsync';
import { overlayStayContent } from '../../lib/stay-overlay';
import { checkApiHealth } from '../../services/health.service';
import { fetchStays, offlineStays } from '../../services/stays.service';
import type { Stay } from '../../types/domain';

export interface StayCatalog {
  /**
   * The PUBLISHED catalog — the only properties the public site may show,
   * search, link to or plot on a map. This is `featuredStayIds` from the
   * content document, not everything active in OwnerRez.
   */
  stays: Stay[];
  /**
   * Every active OwnerRez property, published or not. Exposed ONLY so the admin
   * editor can choose what to publish and prepare copy in advance. Nothing on
   * the public site may render from this.
   */
  allStays: Stay[];
  /** Where the rendered data came from. */
  source: 'live' | 'offline';
  isLoading: boolean;
  error: unknown;
  /** Filled in after a failure: tells us whether the proxy itself is reachable. */
  proxyReachable: boolean | null;
  reload: () => void;
}

/**
 * Loads the stay catalog.
 *
 * Strategy preserved from the original app: the repo catalog renders
 * immediately so the first paint always has content, and the live OwnerRez
 * catalog replaces it the moment /api/properties answers. A failure leaves the
 * offline catalog in place — but, unlike before, it is now surfaced to the
 * visitor instead of being logged and hidden.
 */
export function useStayCatalog(): StayCatalog {
  const fallback = useMemo(() => offlineStays(), []);
  const { data, status, error, reload } = useAsync<Stay[]>(
    (signal) => fetchStays(signal),
    [],
    { initialData: fallback },
  );

  const [proxyReachable, setProxyReachable] = useState<boolean | null>(null);
  const probed = useRef(false);

  useEffect(() => {
    if (status !== 'error' || probed.current) return;
    probed.current = true;
    checkApiHealth()
      .then((health) => setProxyReachable(health.ok))
      .catch(() => setProxyReachable(false));
  }, [status]);

  useEffect(() => {
    if (status === 'loading') probed.current = false;
  }, [status]);

  const live = status === 'success' && (data?.length ?? 0) > 0;
  const resolved = live ? (data as Stay[]) : fallback;

  // Editorial overrides are applied at render time, so editing copy never
  // causes a refetch of the property catalog.
  const content = useSiteContent();
  const editorial = useStaysContent();
  const stays = useMemo(
    () => overlayStayContent(resolved, editorial.stays),
    [resolved, editorial.stays],
  );

  // The published set. Restricting it here rather than in each consumer means
  // search, deep links, the map and the hero counts are all confined to it by
  // construction — a property cannot leak onto the site by way of a component
  // that forgot to filter.
  const published = useMemo(() => {
    const wanted = new Set(content.featuredStayIds);
    return stays.filter((stay) => wanted.has(stay.id));
  }, [stays, content.featuredStayIds]);

  return {
    stays: published,
    allStays: stays,
    source: live ? 'live' : 'offline',
    isLoading: status === 'loading',
    error: status === 'error' ? error : undefined,
    proxyReachable,
    reload,
  };
}

/** Finds a stay by slug or by raw OwnerRez id — the ?property= deep-link rule. */
export function findStay(stays: Stay[], slugOrId: string | null): Stay | null {
  if (!slugOrId) return null;
  const needle = slugOrId.toLowerCase();
  return stays.find((stay) => stay.slug.toLowerCase() === needle || stay.id === slugOrId) ?? null;
}
