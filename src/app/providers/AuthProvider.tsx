import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthStatus, SessionUser } from '@/types/auth';
import type { SessionManager, StoredSession } from '@/api/client/session';
import { sessionManager as defaultSessionManager } from '@/api/client';
import { chargerSession, deconnexion } from '@/services/auth';

export interface AuthContextValue {
  status: AuthStatus;
  session: SessionUser | null;
  setSession: (user: SessionUser, stored: StoredSession) => void;
  /** Recharge le profil et les permissions (`GET /me`, `GET /me/capacites`). */
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: ReactNode;
  /** Seam de test : session imposée, aucune requête émise. */
  initialSession?: SessionUser | null;
  sessionManager?: SessionManager;
  /** Chargement du profil de session (par défaut : API `GET /me`). */
  loadUser?: () => Promise<SessionUser>;
}

/**
 * Provider d'authentification de moncar-web.
 *
 * - Au démarrage, un jeton stocké et non expiré est validé par `GET /me` ;
 *   sinon la session est effacée.
 * - `onUnauthorized` du HttpClient (401) vide la session → état
 *   « unauthenticated » via `sessionManager.onChange`.
 * - Le seam `initialSession` garde les tests sans dépendance au stockage.
 */
export function AuthProvider({
  children,
  initialSession,
  sessionManager = defaultSessionManager,
  loadUser = chargerSession,
}: AuthProviderProps) {
  const [user, setUser] = useState<SessionUser | null>(initialSession ?? null);
  const [status, setStatus] = useState<AuthStatus>(() => {
    if (initialSession === undefined) return 'loading';
    return initialSession === null ? 'unauthenticated' : 'authenticated';
  });

  useEffect(() => {
    if (initialSession !== undefined) return;
    let cancelled = false;
    const stored = sessionManager.get();
    if (stored === null || sessionManager.isExpired()) {
      sessionManager.clear();
      queueMicrotask(() => {
        if (cancelled) return;
        setUser(null);
        setStatus('unauthenticated');
      });
      return () => {
        cancelled = true;
      };
    }
    loadUser()
      .then((loaded) => {
        if (cancelled) return;
        setUser(loaded);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled) return;
        sessionManager.clear();
        setUser(null);
        setStatus('unauthenticated');
      });
    return () => {
      cancelled = true;
    };
  }, [initialSession, sessionManager, loadUser]);

  useEffect(() => {
    return sessionManager.onChange((next) => {
      if (next === null || sessionManager.isExpired()) {
        setUser(null);
        setStatus('unauthenticated');
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

  const refresh = useCallback(async () => {
    const loaded = await loadUser();
    setUser(loaded);
  }, [loadUser]);

  const logout = useCallback(() => {
    void deconnexion();
    sessionManager.clear();
    setUser(null);
    setStatus('unauthenticated');
  }, [sessionManager]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, session: user, setSession, refresh, logout }),
    [status, user, setSession, refresh, logout],
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
