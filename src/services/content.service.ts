import { defaultSiteContent, type SiteContentDocument } from '../content/site-content';
import { emptyStaysDocument, type StaysContentDocument } from '../content/stays-document';
import { parseSiteContent, parseStaysContent } from '../lib/content-schema';
import { ApiError, apiRequest } from './http';

/**
 * Reads and writes the editable content documents.
 *
 * Read path: `GET /api/content` (page copy) and `GET /api/content/stays`
 * (per-stay editorial). Both are same-origin, so the existing Amplify
 * `/api/<*>` rewrite already covers them — no new CORS, no public bucket.
 *
 * Read failure policy: ANY failure — 404, 5xx, timeout, malformed JSON —
 * resolves to the bundled content rather than rejecting. Copy is not worth an
 * error state, and until the backend routes are deployed a 404 is the expected
 * answer. Genuine outages still surface through the property catalog, which
 * does report errors.
 *
 * Write path: `PUT`, and unlike every other call in this app it carries an
 * Authorization header. Writes must fail loudly.
 */

export type ContentSource = 'bundled' | 'remote';

export interface ResolvedSiteContent {
  document: SiteContentDocument;
  source: ContentSource;
}

export interface ResolvedStaysContent {
  document: StaysContentDocument;
  source: ContentSource;
}

const BUNDLED_SITE: ResolvedSiteContent = { document: defaultSiteContent, source: 'bundled' };
const BUNDLED_STAYS: ResolvedStaysContent = { document: emptyStaysDocument, source: 'bundled' };

function isExpectedAbsence(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export async function fetchSiteContent(signal?: AbortSignal): Promise<ResolvedSiteContent> {
  try {
    const raw = await apiRequest<unknown>('/api/content', { signal, timeoutMs: 6000 });
    if (raw === null) return BUNDLED_SITE;
    return { document: parseSiteContent(raw, defaultSiteContent), source: 'remote' };
  } catch (error) {
    if (signal?.aborted) throw error;
    if (!isExpectedAbsence(error)) console.warn('[content] using bundled page copy:', error);
    return BUNDLED_SITE;
  }
}

export async function fetchStaysContent(signal?: AbortSignal): Promise<ResolvedStaysContent> {
  try {
    const raw = await apiRequest<unknown>('/api/content/stays', { signal, timeoutMs: 8000 });
    if (raw === null) return BUNDLED_STAYS;
    return { document: parseStaysContent(raw), source: 'remote' };
  } catch (error) {
    if (signal?.aborted) throw error;
    if (!isExpectedAbsence(error)) console.warn('[content] using bundled stay content:', error);
    return BUNDLED_STAYS;
  }
}

/**
 * The COMPLETE stays document, including unpublished properties — admin only.
 *
 * The editor must seed its draft from this, not from `fetchStaysContent`. That
 * public read is trimmed to published properties, so seeding from it and then
 * publishing would erase every unpublished property's copy.
 */
export async function fetchAllStaysContent(
  token: string,
  signal?: AbortSignal,
): Promise<StaysContentDocument> {
  const raw = await apiRequest<unknown>('/api/content/stays/all', {
    token,
    signal,
    timeoutMs: 12_000,
  });
  return parseStaysContent(raw);
}

/**
 * Publishes a content document. Requires an admin bearer token; the Lambda
 * verifies it against the Cognito user pool before writing to S3. Errors are
 * propagated so the editor can show exactly what went wrong.
 */
export async function saveSiteContent(
  document: SiteContentDocument,
  token: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequest<unknown>('/api/content', {
    method: 'PUT',
    body: { ...document, updatedAt: new Date().toISOString() },
    token,
    signal,
    timeoutMs: 20_000,
  });
}

export async function saveStaysContent(
  document: StaysContentDocument,
  token: string,
  signal?: AbortSignal,
): Promise<void> {
  await apiRequest<unknown>('/api/content/stays', {
    method: 'PUT',
    body: { ...document, updatedAt: new Date().toISOString() },
    token,
    signal,
    timeoutMs: 30_000,
  });
}
