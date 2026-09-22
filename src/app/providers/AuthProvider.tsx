import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthStatus, SessionUser } from '@/types/auth';
import type { SessionManager, StoredSession } from '@/api/client/session';
import { sessionManager as defaultSessionManager } from '@/api/client';

export interface AuthContextValue {
  status: AuthStatus;
  session: SessionUser | null;
  setSession: (user: SessionUser, stored: StoredSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  initialSession?: SessionUser | null;
  sessionManager?: SessionManager;
}

function buildSessionUserFromStored(_stored: StoredSession | null): SessionUser | null {
  return null;
}

/**
 * Provider d'authentification de moncar-web.
 *
 * ⚠️ Infrastructure uniquement : AUCUN endpoint métier n'est appelé ici.
 * La véritable vérification / restauration de session sera branchée dès que
 * le contrat OpenAPI de Richard sera disponible (Sprint 1 J5-J6).
 *
 * En attendant :
 * - `sessionManager` centralise le stockage et l'expiration du token ;
 * - `onUnauthorized` du HttpClient déclenche `logout()` via le provider ;
 * - le seam `initialSession` garde les tests sans dépendance au storage.
 */
export function AuthProvider({
  children,
  initialSession,
  sessionManager = defaultSessionManager,
}: AuthProviderProps) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    if (initialSession === undefined) return buildSessionUserFromStored(sessionManager.get());
    return initialSession;
  });

  const [status, setStatus] = useState<AuthStatus>(() => {
    if (initialSession === undefined) return 'loading';
    return initialSession === null ? 'unauthenticated' : 'authenticated';
  });

  useEffect(() => {
    if (initialSession !== undefined) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      const stored = sessionManager.get();
      if (stored === null || sessionManager.isExpired()) {
        sessionManager.clear();
        setUser(null);
        setStatus('unauthenticated');
      } else {
        setUser(buildSessionUserFromStored(stored));
        setStatus('authenticated');
      }
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [initialSession, sessionManager]);

  useEffect(() => {
    return sessionManager.onChange((next) => {
      if (next === null) {
        setUser(null);
        setStatus('unauthenticated');
      } else if (sessionManager.isExpired()) {
        setUser(null);
        setStatus('unauthenticated');
      } else {
        setUser(buildSessionUserFromStored(next));
        setStatus('authenticated');
      }
    });
  }, [sessionManager]);

  const setSession = useCallback(
    (nextUser: SessionUser, stored: StoredSession) => {
      sessionManager.set(stored);
      setUser(nextUser);
      setStatus('authenticated');
    },
    [sessionManager],
  );

  const logout = useCallback(() => {
    sessionManager.clear();
    setUser(null);
    setStatus('unauthenticated');
  }, [sessionManager]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, session: user, setSession, logout }),
    [status, user, setSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth doit être utilisé à l’intérieur d’un <AuthProvider>.');
  }
  return context;
}
