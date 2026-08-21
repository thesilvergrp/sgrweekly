// silver-group OwnerRez proxy — AWS Lambda handler (Node 20+ runtime).
//
// Self-contained: paste this whole file into the Lambda console editor as
// `index.mjs` and it works. The AWS SDK v3 is bundled into the Node.js 20.x /
// 22.x Lambda runtimes, so there's no package.json or bundler step needed.
//
// Credentials are read from AWS Secrets Manager (secret `silver-group/ownerrez`
// in the Lambda's own region), fetched once per cold start and cached for the
// life of the warm container. The Lambda's execution role needs
// secretsmanager:GetSecretValue on that secret.
//
// Designed for a Lambda Function URL with payload format v2.0. Works behind
// Amplify's /api/* rewrite without API Gateway.

import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { createPublicKey, verify as verifySignature } from 'node:crypto';

const OR_BASE = 'https://api.ownerrez.com/v2';
const OR_BASE_V1 = 'https://api.ownerrez.com/v1'; // pricing lives on the v1 listings API
const SECRET_ID = 'silver-group/ownerrez';

// ─── Editable content (S3) ──────────────────────────────────────────────────
// All optional: with CONTENT_BUCKET unset every content route answers 404 and
// the site renders the copy built into its own bundle. Nothing else is affected.
const CONTENT_BUCKET = process.env.CONTENT_BUCKET ?? '';
const CONTENT_PREFIX = process.env.CONTENT_PREFIX ?? 'site';
const CONTENT_TTL_MS = Number(process.env.CONTENT_TTL_MS ?? 60_000);
const CONTENT_MAX_BYTES = 2 * 1024 * 1024; // refuse absurd documents outright

// Admin sign-in (Cognito). Writes are refused unless BOTH are set.
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID ?? '';
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID ?? '';
// Optional: when set, the caller must also be in this Cognito group.
const COGNITO_ADMIN_GROUP = process.env.COGNITO_ADMIN_GROUP ?? '';

// ─── Contact form (SES) ─────────────────────────────────────────────────────
// Optional: with CONTACT_TO unset the route answers 503 and the site keeps its
// mailto: fallback, so a misconfiguration degrades rather than breaks.
const CONTACT_TO = process.env.CONTACT_TO ?? '';
const CONTACT_FROM = process.env.CONTACT_FROM ?? '';
// Crude flood guard: per warm container, so it blunts a naive script rather
// than a distributed one. The real ceilings are SES's own sending quota and,
// if abuse ever appears, WAF or a challenge in front of the route.
const CONTACT_MAX_PER_WINDOW = Number(process.env.CONTACT_MAX_PER_WINDOW ?? 5);
const CONTACT_WINDOW_MS = 60_000;

/** Logical document name → S3 key. Nothing else is readable or writable. */
const CONTENT_DOCUMENTS = {
  site: `${CONTENT_PREFIX}/site.json`,
  stays: `${CONTENT_PREFIX}/stays.json`,
};

// ─── Errors ─────────────────────────────────────────────────────────────────
class ProxyError extends Error {
  constructor(status, body) {
    super(`OwnerRez ${status}: ${body}`);
    this.status = status;
    this.body = body;
  }
}

// ─── Credentials (Secrets Manager, cached per warm container) ───────────────
const sm = new SecretsManagerClient({}); // defaults to the Lambda's own region

let cachedCreds;

async function loadCreds() {
  if (cachedCreds) return cachedCreds;

  let parsed;
  try {
    const out = await sm.send(new GetSecretValueCommand({ SecretId: SECRET_ID }));
    parsed = JSON.parse(out.SecretString ?? '{}');
  } catch (err) {
    throw new ProxyError(500, `Could not read secret ${SECRET_ID}: ${err?.message ?? err}`);
  }

  const username = (parsed.OWNERREZ_USERNAME ?? '').trim();
  const pat = (parsed.OWNERREZ_PAT ?? '').trim();
  if (!username || !pat) {
    throw new ProxyError(500, 'OwnerRez credentials missing or malformed in Secrets Manager');
  }

  cachedCreds = { username, pat };
  return cachedCreds;
}

async function authHeader() {
  const { username, pat } = await loadCreds();
  return 'Basic ' + Buffer.from(`${username}:${pat}`).toString('base64');
}

// ─── Content store (S3) ─────────────────────────────────────────────────────
const s3 = CONTENT_BUCKET ? new S3Client({}) : null;

/** name → { body, etag, fetchedAt }. Per warm container. */
const contentCache = new Map();

async function readContent(name) {
  if (!s3) throw new ProxyError(404, 'No content store configured');

  const key = CONTENT_DOCUMENTS[name];
  const cached = contentCache.get(name);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < CONTENT_TTL_MS) return cached.body;

  try {
    const out = await s3.send(
      new GetObjectCommand({
        Bucket: CONTENT_BUCKET,
        Key: key,
        // Conditional GET: an unchanged document costs a 304, not a transfer.
        ...(cached?.etag ? { IfNoneMatch: cached.etag } : {}),
      }),
    );
    const text = await out.Body.transformToString();
    const body = JSON.parse(text);
    contentCache.set(name, { body, etag: out.ETag, fetchedAt: now });
    return body;
  } catch (err) {
    const status = err?.$metadata?.httpStatusCode;
    if (status === 304 && cached) {
      cached.fetchedAt = now; // unchanged — extend the lease
      return cached.body;
    }
    if (status === 404 || err?.name === 'NoSuchKey') {
      // Not an error: the site falls back to its built-in copy.
      throw new ProxyError(404, `No ${name} document published`);
    }
    throw new ProxyError(502, `Could not read ${name} content: ${err?.message ?? err}`);
  }
}

async function writeContent(name, document) {
  if (!s3) throw new ProxyError(503, 'No content store configured');

  const serialised = JSON.stringify(document);
  if (serialised.length > CONTENT_MAX_BYTES) {
    throw new ProxyError(413, 'Content document is too large');
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: CONTENT_BUCKET,
      Key: CONTENT_DOCUMENTS[name],
      Body: serialised,
      ContentType: 'application/json',
      CacheControl: 'no-cache',
    }),
  );

  // Drop the cache so the next read reflects the write immediately in this
  // container. Other warm containers catch up within CONTENT_TTL_MS.
  contentCache.delete(name);
  return { ok: true, document: name, bytes: serialised.length };
}

// ─── Contact form ───────────────────────────────────────────────────────────
const ses = CONTACT_TO ? new SESv2Client({}) : null;

let contactWindowStart = 0;
let contactCount = 0;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trim, collapse newlines that could forge headers, and cap the length. */
function clean(value, max) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\r\n]+/g, ' ').trim().slice(0, max);
}

/** Message body keeps its newlines; only the length is capped. */
function cleanBody(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

async function sendContactMessage(body) {
  if (!ses || !CONTACT_TO || !CONTACT_FROM) {
    throw new ProxyError(503, 'Contact form is not configured');
  }

  // Honeypot: a field no human sees. Anything that fills it is a bot, and it
  // gets a cheerful 200 so it has no signal to adapt to.
  if (clean(body?.company, 200)) {
    console.log('[contact] honeypot triggered, dropping silently');
    return { ok: true };
  }

  const name = clean(body?.name, 200);
  const email = clean(body?.email, 254);
  const phone = clean(body?.phone, 50);
  const topic = clean(body?.topic, 120) || 'Website enquiry';
  const message = cleanBody(body?.message, 5000);

  if (!name || !email || !message) {
    throw new ProxyError(400, 'name, email and message are required');
  }
  if (!EMAIL_RE.test(email)) {
    throw new ProxyError(400, 'That email address does not look valid');
  }

  // Counted here, after validation, so the limit caps messages actually SENT.
  // Counting rejected requests instead would throttle someone who mistypes
  // their address twice and then corrects it, which is a real user, not abuse.
  const now = Date.now();
  if (now - contactWindowStart > CONTACT_WINDOW_MS) {
    contactWindowStart = now;
    contactCount = 0;
  }
  if (++contactCount > CONTACT_MAX_PER_WINDOW) {
    throw new ProxyError(429, 'Too many messages just now — please try again shortly');
  }

  const text = [
    `Topic:   ${topic}`,
    `Name:    ${name}`,
    `Email:   ${email}`,
    phone ? `Phone:   ${phone}` : null,
    '',
    message,
    '',
    '— sent from the sgrweekly.net contact form',
  ]
    .filter((line) => line !== null)
    .join('\n');

  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: CONTACT_FROM,
      Destination: { ToAddresses: [CONTACT_TO] },
      // Replying in the mail client reaches the guest, not the no-reply box.
      ReplyToAddresses: [email],
      Content: {
        Simple: {
          Subject: { Data: `[Website] ${topic} — ${name}`, Charset: 'UTF-8' },
          Body: { Text: { Data: text, Charset: 'UTF-8' } },
        },
      },
    }),
  );

  return { ok: true };
}

// ─── Admin authentication (Cognito id token, RS256) ─────────────────────────
// Verified here rather than trusted from the client. No dependency: the Node 20
// runtime can build a public key from a JWK and check an RSA signature.
let jwksCache = null;

async function loadJwks() {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < 3_600_000) return jwksCache.keys;

  const region = COGNITO_USER_POOL_ID.split('_')[0];
  const url = `https://cognito-idp.${region}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;
  const res = await fetch(url);
  if (!res.ok) throw new ProxyError(500, `Could not fetch Cognito JWKS (${res.status})`);

  const { keys } = await res.json();
  jwksCache = { keys, fetchedAt: Date.now() };
  return keys;
}

function base64UrlDecode(segment) {
  return Buffer.from(segment.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
 * Verifies a Cognito ID token and returns its claims. Throws ProxyError(401)
 * on anything suspicious — an unverified token is never allowed to write.
 */
async function requireAdmin(headers) {
  if (!COGNITO_USER_POOL_ID || !COGNITO_CLIENT_ID) {
    throw new ProxyError(503, 'Editing is not enabled on this deployment');
  }

  const header = headers?.authorization ?? headers?.Authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new ProxyError(401, 'Sign-in required');

  const parts = token.split('.');
  if (parts.length !== 3) throw new ProxyError(401, 'Malformed token');

  let head;
  let claims;
  try {
    head = JSON.parse(base64UrlDecode(parts[0]).toString('utf8'));
    claims = JSON.parse(base64UrlDecode(parts[1]).toString('utf8'));
  } catch {
    throw new ProxyError(401, 'Malformed token');
  }

  if (head.alg !== 'RS256') throw new ProxyError(401, 'Unsupported token algorithm');

  const jwk = (await loadJwks()).find((key) => key.kid === head.kid);
  if (!jwk) throw new ProxyError(401, 'Unknown signing key');

  const signatureValid = verifySignature(
    'RSA-SHA256',
    Buffer.from(`${parts[0]}.${parts[1]}`),
    createPublicKey({ key: jwk, format: 'jwk' }),
    base64UrlDecode(parts[2]),
  );
  if (!signatureValid) throw new ProxyError(401, 'Token signature is not valid');

  const region = COGNITO_USER_POOL_ID.split('_')[0];
  const expectedIssuer = `https://cognito-idp.${region}.amazonaws.com/${COGNITO_USER_POOL_ID}`;
  const now = Math.floor(Date.now() / 1000);

  if (claims.iss !== expectedIssuer) throw new ProxyError(401, 'Token issuer is not valid');
  if (claims.token_use !== 'id') throw new ProxyError(401, 'Wrong token type');
  if (claims.aud !== COGNITO_CLIENT_ID) throw new ProxyError(401, 'Token audience is not valid');
  if (typeof claims.exp !== 'number' || claims.exp <= now) throw new ProxyError(401, 'Token has expired');
  if (typeof claims.nbf === 'number' && claims.nbf > now) throw new ProxyError(401, 'Token is not yet valid');

  if (COGNITO_ADMIN_GROUP) {
    const groups = claims['cognito:groups'] ?? [];
    if (!Array.isArray(groups) || !groups.includes(COGNITO_ADMIN_GROUP)) {
      throw new ProxyError(403, 'This account cannot edit content');
    }
  }

  return claims;
}

/**
 * The public stays document, trimmed to the properties actually published.
 *
 * The stored document holds editorial for every property, including ones being
 * prepared before they go live, so an anonymous read must not return all of it.
 *
 * This is a SEPARATE route from the admin's full read on purpose. Serving both
 * audiences from one cacheable URL would mean a response that varies by
 * Authorization header — and a CDN that ignores that header would happily serve
 * one audience's copy to the other.
 *
 * If the site document cannot be read we cannot know what is published, so the
 * safe answer is an empty overlay: the site falls back to the copy built into
 * its own bundle rather than over-disclosing.
 */
async function readPublishedStays() {
  const document = await readContent('stays');

  let published = [];
  try {
    published = (await readContent('site'))?.featuredStayIds ?? [];
  } catch {
    published = [];
  }

  const allowed = new Set(published);
  const stays = {};
  for (const [id, entry] of Object.entries(document?.stays ?? {})) {
    if (allowed.has(id)) stays[id] = entry;
  }
  return { ...document, stays };
}

// ─── OwnerRez client ────────────────────────────────────────────────────────
async function or(path, { method = 'GET', body, base = OR_BASE } = {}) {
  const headers = {
    Authorization: await authHeader(),
    Accept: 'application/json',
    'User-Agent': 'silver-group-amplify-proxy/0.1',
  };
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${base}${path}`, { method, headers, body });
  const text = await res.text();
  if (!res.ok) throw new ProxyError(res.status, text || res.statusText);
  return text ? JSON.parse(text) : null;
}

const listProperties = () => or('/properties?active=true');
const getProperty = (id) => or(`/properties/${encodeURIComponent(id)}`);
const listBookings = (id, since, offset, limit) => {
  let p = `/bookings?property_ids=${encodeURIComponent(id)}&since_utc=${encodeURIComponent(since)}`;
  if (offset !== undefined) p += `&offset=${encodeURIComponent(offset)}`;
  if (limit !== undefined) p += `&limit=${encodeURIComponent(limit)}`;
  return or(p);
};
const listQuotes = (id) => or(`/quotes?property_ids=${encodeURIComponent(id)}`);
const listPricing = (id, start, end) =>
  or(
    `/listings/${encodeURIComponent(id)}/pricing?includePricingRules=true&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
    { base: OR_BASE_V1 },
  );
const createInquiry = (payload) =>
  or('/inquiries', { method: 'POST', body: JSON.stringify(payload) });

/** Parse a numeric query param; returns undefined when absent or not finite. */
const toInt = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

// ─── Router ─────────────────────────────────────────────────────────────────
async function route(method, path, query, body, headers) {
  if (method === 'GET' && path === '/api/health') {
    let hasCredentials = false;
    try {
      await loadCreds();
      hasCredentials = true;
    } catch {
      hasCredentials = false;
    }
    return { ok: true, hasCredentials };
  }

  // ─── Editable content ─────────────────────────────────────────────────────
  // Public reads; authenticated writes. A missing document answers 404, which
  // the site treats as "use the copy built into the bundle".
  // Admin-only: the COMPLETE stays document, including unpublished properties.
  // The editor must seed its draft from this — seeding from the trimmed public
  // document and then publishing would erase every unpublished property's copy.
  if (method === 'GET' && path === '/api/content/stays/all') {
    await requireAdmin(headers);
    return readContent('stays');
  }

  if (path === '/api/content' || path === '/api/content/stays') {
    const name = path === '/api/content/stays' ? 'stays' : 'site';

    if (method === 'GET') {
      return name === 'stays' ? readPublishedStays() : readContent(name);
    }

    if (method === 'PUT') {
      await requireAdmin(headers);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new ProxyError(400, 'Content document must be a JSON object');
      }
      if (typeof body.version !== 'number') {
        throw new ProxyError(400, 'Content document must carry a numeric version');
      }
      return writeContent(name, body);
    }
  }

  if (method === 'GET' && path === '/api/properties') {
    return listProperties();
  }

  let m;
  if (method === 'GET' && (m = path.match(/^\/api\/properties\/([^/]+)$/))) {
    return getProperty(m[1]);
  }

  if (method === 'GET' && (m = path.match(/^\/api\/properties\/([^/]+)\/bookings$/))) {
    const since = query.since ?? new Date().toISOString();
    return listBookings(m[1], since, toInt(query.offset), toInt(query.limit));
  }

  if (method === 'GET' && (m = path.match(/^\/api\/properties\/([^/]+)\/quotes$/))) {
    return listQuotes(m[1]);
  }

  if (method === 'GET' && (m = path.match(/^\/api\/properties\/([^/]+)\/pricing$/))) {
    if (!query.start || !query.end) {
      throw new ProxyError(400, 'start and end query params are required');
    }
    return listPricing(m[1], query.start, query.end);
  }

  if (method === 'POST' && path === '/api/contact') {
    return sendContactMessage(body);
  }

  if (method === 'POST' && path === '/api/inquiries') {
    if (
      !body?.property_id ||
      !body?.arrival ||
      !body?.departure ||
      !body?.guest?.first_name ||
      !body?.guest?.email_address
    ) {
      throw new ProxyError(
        400,
        'property_id, arrival, departure, guest.first_name and guest.email_address are required',
      );
    }
    return createInquiry(body);
  }

  return undefined;
}

// ─── Lambda entrypoint (Function URL, payload v2.0) ─────────────────────────
export const handler = async (event) => {
  const method = event.requestContext?.http?.method ?? 'GET';
  let path = event.rawPath ?? '/';
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1); // tolerate a trailing slash
  const query = event.queryStringParameters ?? {};
  const headers = event.headers ?? {};

  let body;
  if (event.body) {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body;
    try {
      body = raw ? JSON.parse(raw) : undefined;
    } catch {
      return respond(400, { error: 'Invalid JSON body' });
    }
  }

  try {
    const payload = await route(method, path, query, body, headers);
    if (payload === undefined) {
      return respond(404, { error: `No route for ${method} ${path}` });
    }
    // Content reads are cached at the edge so a page load rarely reaches S3;
    // an edit is visible within the max-age. Everything else stays uncached,
    // because availability and pricing must never be stale.
    // Public content reads are edge-cacheable. The admin's full read is not:
    // it is authorization-dependent and must never be stored by a shared cache.
    let extra;
    if (method === 'GET' && path === '/api/content/stays/all') {
      extra = { 'Cache-Control': 'no-store' };
    } else if (method === 'GET' && path.startsWith('/api/content')) {
      extra = { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' };
    }
    return respond(200, payload, extra);
  } catch (err) {
    if (err instanceof ProxyError) {
      return respond(err.status, { error: err.body });
    }
    console.error('[ownerrez-lambda]', err);
    return respond(500, { error: err?.message ?? 'Internal error' });
  }
};

function respond(statusCode, payload, extraHeaders) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      // Permissive CORS — narrow this to the Amplify domain once known.
      // Production traffic is same-origin through the Amplify rewrite, so this
      // only matters when the Function URL is called directly.
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...extraHeaders,
    },
    body: JSON.stringify(payload),
  };
}
