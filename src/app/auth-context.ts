import { createContext, useContext } from 'react';
import type { AdminSession } from '../services/auth.service';

export interface AuthValue {
  session: AdminSession | null;
  /** True while a callback is being exchanged for tokens. */
  isResolving: boolean;
  error: string | null;
  /** False when this deployment has no Cognito configuration. */
  isConfigured: boolean;
  signIn: () => void;
  signOut: () => void;
  /** A token guaranteed fresh at call time, or null if signed out. */
  getToken: () => string | null;
}

export const AuthContext = createContext<AuthValue>({
  session: null,
  isResolving: false,
  error: null,
  isConfigured: false,
  signIn: () => {},
  signOut: () => {},
  getToken: () => null,
});

export function useAuth(): AuthValue {
  return useContext(AuthContext);
}
