/**
 * Environment contract for the browser bundle.
 *
 * The SPA requires ZERO environment variables — that is a deliberate property of
 * the deployment (DEPLOY.md step 3.6) and is preserved. The OwnerRez credentials
 * (OWNERREZ_USERNAME / OWNERREZ_PAT) are server-side only and are intentionally
 * un-prefixed so Vite cannot leak them into the client bundle.
 *
 * VITE_API_BASE_URL is optional and defaults to '' — which reproduces today's
 * same-origin `/api/...` calls exactly, matching the Amplify rewrite
 * `/api/<*> -> https://<fn>.lambda-url.<region>.on.aws/api/<*>`. It exists only
 * so a developer can point the SPA straight at a Function URL while debugging.
 * It is unset in Amplify and must stay that way.
 */

function readBase(): string {
  // Optional chaining keeps this importable outside a Vite bundle (test runners).
  const raw = import.meta.env?.VITE_API_BASE_URL;
  if (typeof raw !== 'string') return '';
  return raw.replace(/\/+$/, '');
}

export const env = {
  /** '' means "same origin", i.e. rely on the Amplify /api/* rewrite. */
  apiBaseUrl: readBase(),
  isDev: Boolean(import.meta.env?.DEV),
} as const;
