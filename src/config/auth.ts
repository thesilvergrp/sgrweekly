/**
 * Cognito configuration for the admin editor.
 *
 * IMPORTANT: these are the ONLY environment variables the SPA reads, and they
 * are optional. Leave them unset and the admin route reports that editing is
 * not configured while the public site behaves exactly as before — the
 * "zero environment variables to build and serve the site" property is
 * preserved. Set them only on the branch/environment that should offer editing.
 *
 * None of these values are secrets. A Cognito app client used by a browser is a
 * PUBLIC client: it has no client secret, which is precisely why the flow below
 * is Authorization Code with PKCE rather than the implicit grant.
 *
 *   VITE_COGNITO_DOMAIN     e.g. https://silvergroup-admin.auth.us-east-1.amazoncognito.com
 *   VITE_COGNITO_CLIENT_ID  the app client id
 *   VITE_COGNITO_SCOPES     optional, defaults to "openid email"
 */

function read(key: 'VITE_COGNITO_DOMAIN' | 'VITE_COGNITO_CLIENT_ID' | 'VITE_COGNITO_SCOPES'): string {
  const value = import.meta.env?.[key];
  return typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';
}

const domain = read('VITE_COGNITO_DOMAIN');
const clientId = read('VITE_COGNITO_CLIENT_ID');

export const authConfig = {
  domain,
  clientId,
  scopes: read('VITE_COGNITO_SCOPES') || 'openid email',
  /** Must be registered verbatim as a callback URL on the Cognito app client. */
  redirectUri: typeof window !== 'undefined' ? `${window.location.origin}/` : '/',
  /** True only when the deployment is set up for editing. */
  isConfigured: Boolean(domain && clientId),
} as const;
