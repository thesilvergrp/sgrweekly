import { env } from '../config/env';

/**
 * Thin transport for the /api/* proxy.
 *
 * Contract notes that this module encodes (see docs/api-inventory.md):
 *  • Every path is same-origin `/api/...` so the Amplify 200-rewrite handles it.
 *    No credentials, cookies or auth headers are ever sent — authorisation is
 *    entirely server-side (the Lambda holds the OwnerRez PAT).
 *  • Errors come back as `{ "error": "<message>" }` with the upstream OwnerRez
 *    status preserved, so a 401/403 means the PROXY's credentials are wrong,
 *    never the visitor's.
 */

export type ApiErrorKind = 'network' | 'timeout' | 'client' | 'server' | 'credentials' | 'parse';

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly detail: string;
  readonly path: string;

  constructor(kind: ApiErrorKind, status: number, path: string, detail: string) {
    super(`${kind} error ${status || ''} on ${path}: ${detail}`.trim());
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.path = path;
    this.detail = detail;
  }
}

function classify(status: number): ApiErrorKind {
  if (status === 401 || status === 403) return 'credentials';
  if (status >= 500) return 'server';
  return 'client';
}

export function apiUrl(path: string, query?: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return `${env.apiBaseUrl}${path}${qs ? `?${qs}` : ''}`;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT';
  body?: unknown;
  signal?: AbortSignal;
  /** Milliseconds before the request is abandoned. */
  timeoutMs?: number;
  query?: Record<string, string | number | undefined>;
  /**
   * Bearer token for the admin write routes ONLY. Every public read path leaves
   * this unset — the site sends no credentials, which is what keeps the
   * anonymous browsing surface credential-free.
   */
  token?: string;
}

const DEFAULT_TIMEOUT_MS = 15_000;

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, timeoutMs = DEFAULT_TIMEOUT_MS, query, token } = options;
  const url = apiUrl(path, query);

  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort);

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      signal: controller.signal,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (cause) {
    // An abort we caused ourselves is a timeout; an abort the caller caused is
    // a real cancellation and must propagate untouched.
    if (signal?.aborted) throw cause;
    const kind: ApiErrorKind = controller.signal.aborted ? 'timeout' : 'network';
    throw new ApiError(kind, 0, path, kind === 'timeout' ? 'Request timed out' : 'Network request failed');
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener('abort', onExternalAbort);
  }

  const text = await response.text();

  if (!response.ok) {
    throw new ApiError(classify(response.status), response.status, path, extractError(text) || response.statusText);
  }

  if (!text) return null as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('parse', response.status, path, 'Response was not valid JSON');
  }
}

/** Pulls the message out of the proxy's `{ error: string }` envelope. */
function extractError(text: string): string {
  if (!text) return '';
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      const value = (parsed as { error: unknown }).error;
      return typeof value === 'string' ? value : JSON.stringify(value);
    }
  } catch {
    /* not JSON — fall through to the raw body */
  }
  return text.slice(0, 500);
}
