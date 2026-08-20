import { authConfig } from '../config/auth';

/**
 * Admin sign-in: OAuth 2.0 Authorization Code flow with PKCE against the
 * Cognito hosted UI.
 *
 * Why this shape:
 *  • A browser app is a PUBLIC client — it cannot hold a client secret — so
 *    PKCE is the only correct code flow. The implicit grant is deprecated.
 *  • No SDK. The whole flow is two redirects and one form POST, so pulling in
 *    aws-amplify (hundreds of kilobytes) for it would be a poor trade.
 *  • The REFRESH TOKEN IS NEVER STORED. Only the short-lived id/access tokens
 *    are kept, in sessionStorage, so they die with the tab. When they expire
 *    the user is bounced back through the hosted UI, which usually returns
 *    immediately because Cognito holds its own session cookie. That keeps the
 *    longest-lived credential out of web storage entirely.
 *  • The id token is used as the API bearer because the Lambda authorises on
 *    identity (is this an admin user), not on OAuth scopes.
 */

const STORAGE_KEY = 'sg.admin.session';
const VERIFIER_KEY = 'sg.admin.pkce';
const STATE_KEY = 'sg.admin.state';

export interface AdminSession {
  idToken: string;
  accessToken: string;
  /** Epoch milliseconds. */
  expiresAt: number;
  email?: string;
}

/* ── PKCE helpers ─────────────────────────────────────────────────────────── */

function base64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(byteLength = 48): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function challengeFor(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(digest);
}

/** Reads a JWT's claims WITHOUT verifying it. Display only — the Lambda verifies. */
function readClaims(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/* ── Session storage ──────────────────────────────────────────────────────── */

export function loadSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AdminSession;
    if (!session.idToken || typeof session.expiresAt !== 'number') return null;
    // Treat a token expiring within a minute as already gone, so a save cannot
    // start with a token that dies mid-flight.
    if (session.expiresAt - Date.now() < 60_000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function storeSession(session: AdminSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
}

/* ── Flow ─────────────────────────────────────────────────────────────────── */

/** Sends the browser to the hosted UI. Does not return. */
export async function beginSignIn(returnTo: string = window.location.href): Promise<void> {
  if (!authConfig.isConfigured) throw new Error('Cognito is not configured for this deployment');

  const verifier = randomString();
  const state = randomString(16);
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, JSON.stringify({ state, returnTo }));

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: authConfig.clientId,
    redirect_uri: authConfig.redirectUri,
    scope: authConfig.scopes,
    state,
    code_challenge: await challengeFor(verifier),
    code_challenge_method: 'S256',
  });

  window.location.assign(`${authConfig.domain}/oauth2/authorize?${params.toString()}`);
}

/** True when the current URL looks like a hosted-UI callback. */
export function hasAuthCallback(search: string = window.location.search): boolean {
  const params = new URLSearchParams(search);
  return params.has('code') || params.has('error');
}

/**
 * Completes the callback: validates `state`, exchanges the code for tokens and
 * scrubs the parameters from the address bar. Returns null when the URL is not
 * a callback.
 */
export async function completeSignIn(): Promise<AdminSession | null> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const returnedState = params.get('state');
  const error = params.get('error');

  if (!code && !error) return null;

  const stored = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);

  // The hosted UI can only return to a registered callback URL, so any route
  // the user started from (?admin) is restored here.
  restoreRoute(stored);

  if (error) throw new Error(params.get('error_description') || `Sign-in failed: ${error}`);
  if (!verifier || !stored) throw new Error('Sign-in could not be completed — please try again.');

  const { state } = JSON.parse(stored) as { state: string };
  // CSRF guard: a callback we did not initiate must never be honoured.
  if (state !== returnedState) throw new Error('Sign-in state did not match — please try again.');

  const response = await fetch(`${authConfig.domain}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: authConfig.clientId,
      code: code as string,
      redirect_uri: authConfig.redirectUri,
      code_verifier: verifier,
    }),
  });

  if (!response.ok) {
    throw new Error(`Could not complete sign-in (${response.status}). Check the Cognito app client callback URL.`);
  }

  const tokens = (await response.json()) as {
    id_token?: string;
    access_token?: string;
    expires_in?: number;
  };
  if (!tokens.id_token || !tokens.access_token) throw new Error('Cognito returned an unexpected token response');

  const claims = readClaims(tokens.id_token);
  const session: AdminSession = {
    idToken: tokens.id_token,
    accessToken: tokens.access_token,
    expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
    email: typeof claims.email === 'string' ? claims.email : undefined,
  };

  storeSession(session);
  return session;
}

/**
 * Scrubs `code`/`state`/`error` from the address bar and returns the user to
 * wherever they started. Only a same-origin target is honoured — a stored
 * value pointing elsewhere is an open-redirect and is discarded.
 */
function restoreRoute(stored: string | null): void {
  const current = new URL(window.location.href);
  for (const key of ['code', 'state', 'error', 'error_description']) {
    current.searchParams.delete(key);
  }

  let target = current;
  if (stored) {
    try {
      const { returnTo } = JSON.parse(stored) as { returnTo?: string };
      if (returnTo) {
        const candidate = new URL(returnTo, window.location.origin);
        if (candidate.origin === window.location.origin) target = candidate;
      }
    } catch {
      /* keep the scrubbed current URL */
    }
  }

  window.history.replaceState(
    window.history.state,
    '',
    target.pathname + target.search + target.hash,
  );
}

/** Ends the Cognito session as well as the local one. */
export function signOut(returnTo: string = `${window.location.origin}/`): void {
  clearSession();
  if (!authConfig.isConfigured) return;
  const params = new URLSearchParams({
    client_id: authConfig.clientId,
    logout_uri: returnTo,
  });
  window.location.assign(`${authConfig.domain}/logout?${params.toString()}`);
}
