import { createContext, useContext } from 'react';
import { defaultSiteContent, type SiteContentDocument } from '../content/site-content';
import { emptyStaysDocument, type StaysContentDocument } from '../content/stays-document';
import type { ContentSource } from '../services/content.service';

export interface SiteContentValue {
  site: SiteContentDocument;
  stays: StaysContentDocument;
  sources: { site: ContentSource; stays: ContentSource };
  /** Re-reads both documents — used by the admin editor after a publish. */
  refresh: () => void;
}

export const SiteContentContext = createContext<SiteContentValue>({
  site: defaultSiteContent,
  stays: emptyStaysDocument,
  sources: { site: 'bundled', stays: 'bundled' },
  refresh: () => {},
});

/** Page copy, business facts and curation. */
export function useSiteContent(): SiteContentDocument {
  return useContext(SiteContentContext).site;
}

/** Per-stay editorial overrides. */
export function useStaysContent(): StaysContentDocument {
  return useContext(SiteContentContext).stays;
}

/** Business facts — the most-used slice, so it gets its own accessor. */
export function useBusiness() {
  return useContext(SiteContentContext).site.business;
}

export function useContentControls() {
  const { sources, refresh } = useContext(SiteContentContext);
  return { sources, refresh };
}
