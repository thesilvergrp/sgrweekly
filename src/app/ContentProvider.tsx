import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useAsync } from '../hooks/useAsync';
import { defaultSiteContent } from '../content/site-content';
import { emptyStaysDocument } from '../content/stays-document';
import {
  fetchSiteContent,
  fetchStaysContent,
  type ResolvedSiteContent,
  type ResolvedStaysContent,
} from '../services/content.service';
import { SiteContentContext } from './content-context';

const BUNDLED_SITE: ResolvedSiteContent = { document: defaultSiteContent, source: 'bundled' };
const BUNDLED_STAYS: ResolvedStaysContent = { document: emptyStaysDocument, source: 'bundled' };

/**
 * Resolves both content documents at start-up and provides them to the tree.
 *
 * The bundled documents are the initial values, so the first paint is never
 * blocked on a network round trip and there is no copy flash — a remote
 * document only ever replaces text that was already readable.
 *
 * The two documents are fetched independently: a large stay-editorial document
 * failing must not take the page headings down with it.
 */
export function ContentProvider({ children }: { children: ReactNode }) {
  const [nonce, setNonce] = useState(0);

  const site = useAsync<ResolvedSiteContent>((signal) => fetchSiteContent(signal), [nonce], {
    initialData: BUNDLED_SITE,
  });
  const stays = useAsync<ResolvedStaysContent>((signal) => fetchStaysContent(signal), [nonce], {
    initialData: BUNDLED_STAYS,
  });

  const refresh = useCallback(() => setNonce((value) => value + 1), []);

  const value = useMemo(
    () => ({
      site: site.data?.document ?? defaultSiteContent,
      stays: stays.data?.document ?? emptyStaysDocument,
      sources: {
        site: site.data?.source ?? ('bundled' as const),
        stays: stays.data?.source ?? ('bundled' as const),
      },
      refresh,
    }),
    [site.data, stays.data, refresh],
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}
