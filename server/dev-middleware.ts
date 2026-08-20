import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { Connect } from 'vite';
import {
  OwnerRezError,
  createInquiry,
  credsFingerprint,
  getListing,
  getProperty,
  listBookings,
  listListings,
  listPricing,
  listProperties,
  listQuotes,
  listReviews,
  type InquiryPayload,
} from './ownerrez-client';

/**
 * Local stand-in for the S3 content store.
 *
 * Development only. The documents live in ./.content (git-ignored) so the
 * editor can be exercised end to end without touching AWS. There is NO auth
 * here on purpose — the dev server is not reachable from anywhere — whereas the
 * deployed Lambda verifies a Cognito ID token on every write. Never model the
 * production write path on this function.
 */
const CONTENT_DIR = resolve(process.cwd(), '.content');
const CONTENT_FILES: Record<string, string> = {
  site: `${CONTENT_DIR}/site.json`,
  stays: `${CONTENT_DIR}/stays.json`,
};

async function readLocalContent(name: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(CONTENT_FILES[name], 'utf8'));
  } catch {
    // Matches the Lambda: a missing document is a 404, and the site falls back
    // to the copy built into its own bundle.
    throw new OwnerRezError(404, `No ${name} document published`);
  }
}

async function writeLocalContent(name: string, document: unknown): Promise<unknown> {
  if (!document || typeof document !== 'object' || Array.isArray(document)) {
    throw new OwnerRezError(400, 'Content document must be a JSON object');
  }
  if (typeof (document as { version?: unknown }).version !== 'number') {
    throw new OwnerRezError(400, 'Content document must carry a numeric version');
  }
  const file = CONTENT_FILES[name];
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(document, null, 2), 'utf8');
  return { ok: true, document: name, dev: true };
}

/**
 * Vite dev-server middleware that mounts the OwnerRez proxy under /api/*.
 * Keep route handlers thin — the real work lives in ownerrez-client.ts so it
 * ports cleanly to an Amplify Function later. When we deploy, this file goes
 * away; the same routes get re-wired in the Lambda handler.
 */
export function ownerrezDevMiddleware(): Connect.NextHandleFunction {
  return async (req, res, next) => {
    if (!req.url || !req.url.startsWith('/api/')) return next();

    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    const method = req.method ?? 'GET';

    try {
      const payload = await route(method, path, url, req);
      if (payload === undefined) {
        respond(res, 404, { error: `No route for ${method} ${path}` });
        return;
      }
      respond(res, 200, payload);
    } catch (err) {
      if (err instanceof OwnerRezError) {
        respond(res, err.status, { error: err.body });
        return;
      }
      console.error('[ownerrez-proxy]', err);
      const message = err instanceof Error ? err.message : String(err);
      respond(res, 500, { error: message });
    }
  };
}

async function route(
  method: string,
  path: string,
  url: URL,
  _req: Connect.IncomingMessage,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  // GET /api/health — sanity check, doesn't call OwnerRez
  if (method === 'GET' && path === '/api/health') {
    return {
      ok: true,
      hasCredentials: Boolean(process.env.OWNERREZ_USERNAME && process.env.OWNERREZ_PAT),
    };
  }

  // GET /api/debug — surfaces credential fingerprints for troubleshooting.
  // Safe to expose locally because it never returns the actual PAT.
  if (method === 'GET' && path === '/api/debug') {
    return credsFingerprint();
  }

  // Editable content — local mirror of the S3-backed routes on the Lambda.
  if (path === '/api/content' || path === '/api/content/stays') {
    const name = path === '/api/content/stays' ? 'stays' : 'site';
    if (method === 'GET') return readLocalContent(name);
    if (method === 'PUT') return writeLocalContent(name, await readBody(_req));
  }

  if (method === 'GET' && path === '/api/properties') {
    return listProperties();
  }

  const propertyMatch = path.match(/^\/api\/properties\/([^/]+)$/);
  if (method === 'GET' && propertyMatch) {
    return getProperty(propertyMatch[1]);
  }

  if (method === 'GET' && path === '/api/listings') {
    return listListings();
  }

  const listingMatch = path.match(/^\/api\/listings\/([^/]+)$/);
  if (method === 'GET' && listingMatch) {
    return getListing(listingMatch[1]);
  }

  const bookingsMatch = path.match(/^\/api\/properties\/([^/]+)\/bookings$/);
  if (method === 'GET' && bookingsMatch) {
    const since = url.searchParams.get('since') ?? new Date().toISOString();
    const offset = intParam(url.searchParams.get('offset'));
    const limit = intParam(url.searchParams.get('limit'));
    return listBookings(bookingsMatch[1], since, offset, limit);
  }

  const quotesMatch = path.match(/^\/api\/properties\/([^/]+)\/quotes$/);
  if (method === 'GET' && quotesMatch) {
    return listQuotes(quotesMatch[1]);
  }

  const pricingMatch = path.match(/^\/api\/properties\/([^/]+)\/pricing$/);
  if (method === 'GET' && pricingMatch) {
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    if (!start || !end) {
      throw new OwnerRezError(400, 'start and end query params are required');
    }
    return listPricing(pricingMatch[1], start, end);
  }

  const reviewsMatch = path.match(/^\/api\/properties\/([^/]+)\/reviews$/);
  if (method === 'GET' && reviewsMatch) {
    return listReviews(reviewsMatch[1]);
  }

  if (method === 'POST' && path === '/api/inquiries') {
    const body = (await readBody(_req)) as Partial<InquiryPayload>;
    if (
      !body.property_id ||
      !body.arrival ||
      !body.departure ||
      !body.guest?.first_name ||
      !body.guest?.email_address
    ) {
      throw new OwnerRezError(
        400,
        'property_id, arrival, departure, guest.first_name and guest.email_address are required',
      );
    }
    return createInquiry(body as InquiryPayload);
  }

  return undefined;
}

/** Parse a numeric query param; returns undefined when absent or not finite. */
function intParam(v: string | null): number | undefined {
  if (v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function respond(res: import('http').ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function readBody(req: Connect.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new OwnerRezError(400, `Invalid JSON body: ${(err as Error).message}`));
      }
    });
    req.on('error', reject);
  });
}
