import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authConfig } from '../config/auth';
import {
  beginSignIn,
  clearSession,
  completeSignIn,
  hasAuthCallback,
  loadSession,
  signOut as endSession,
  type AdminSession,
} from '../services/auth.service';
import { AuthContext } from './auth-context';

/**
 * Admin session state.
 *
 * Mounted for every visitor but inert for almost all of them: with no Cognito
 * configuration, or no callback in the URL and no stored session, this does
 * nothing at all and costs one synchronous sessionStorage read.
 */
/**
 * Local-development stand-in for a signed-in admin.
 *
 * Gated on `import.meta.env.DEV`, which Vite replaces with the literal `false`
 * in a production build — so this branch is dead code and is stripped from the
 * shipped bundle. It exists only so the editor can be exercised against the dev
 * server's local content store without standing up Cognito.
 */
const DEV_SESSION: AdminSession = {
  idToken: 'dev-no-auth',
  accessToken: 'dev-no-auth',
  expiresAt: Number.MAX_SAFE_INTEGER,
  email: 'local development',
};

// `import.meta.env.DEV` is referenced directly, not through a helper: Vite
// substitutes the literal `false` here in a production build, which lets the
// bundler fold the constant and drop DEV_SESSION and every branch below it.
const useDevBypass = import.meta.env.DEV && !authConfig.isConfigured;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(() =>
    useDevBypass ? DEV_SESSION : loadSession(),
  );
  const [isResolving, setIsResolving] = useState(() => authConfig.isConfigured && hasAuthCallback());
  const [error, setError] = useState<string | null>(null);

  // Complete a hosted-UI callback, if this load is one.
  useEffect(() => {
    if (!authConfig.isConfigured || !hasAuthCallback()) return;
    let active = true;
    setIsResolving(true);

    completeSignIn()
      .then((next) => {
        if (!active || !next) return;
        setSession(next);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : 'Sign-in failed');
        clearSession();
        setSession(null);
      })
      .finally(() => {
        if (active) setIsResolving(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Expire the local session exactly when the token does, so the UI never shows
  // a signed-in state that the API would reject.
  useEffect(() => {
    if (!session || useDevBypass) return;
    const remaining = session.expiresAt - Date.now() - 60_000;
    const timer = window.setTimeout(() => {
      clearSession();
      setSession(null);
    }, Math.max(remaining, 0));
    return () => window.clearTimeout(timer);
  }, [session]);

  const signIn = useCallback(() => {
    if (useDevBypass) {
      setSession(DEV_SESSION);
      return;
    }
    setError(null);
    beginSignIn().catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : 'Could not start sign-in');
    });
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    if (!useDevBypass) endSession();
  }, []);

  const getToken = useCallback(() => {
    if (useDevBypass) return DEV_SESSION.idToken;
    const current = loadSession();
    if (!current) {
      setSession(null);
      return null;
    }
    return current.idToken;
  }, []);

  const value = useMemo(
    () => ({
      session,
      isResolving,
      error,
      isConfigured: authConfig.isConfigured || useDevBypass,
      signIn,
      signOut,
      getToken,
    }),
    [session, isResolving, error, signIn, signOut, getToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
