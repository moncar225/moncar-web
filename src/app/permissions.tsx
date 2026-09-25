import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { PERMISSIONS, type Permission } from '@/domain/permissions'
import { useAuth } from './providers/AuthProvider'

/**
 * Permissions d'affichage (AUTH-003, Marcel) : l'interface masque ou
 * désactive avec un motif ; le serveur reste seul juge à chaque appel.
 */
export function useCan(): (permission: Permission) => boolean {
  const { session } = useAuth()
  return (permission) => session?.permissions?.includes(permission) ?? false
}

export function motifRefus(permission: Permission): string {
  return `Action réservée : « ${PERMISSIONS[permission]} ».`
}

interface CanProps {
  permission: Permission
  /** `hide` (défaut) : rien n'est rendu ; `disable` : rendu désactivé + motif. */
  mode?: 'hide' | 'disable'
  children: ReactNode | ((autorise: boolean, motif: string) => ReactNode)
}

export function Can({ permission, mode = 'hide', children }: CanProps) {
  const autorise = useCan()(permission)
  const motif = motifRefus(permission)
  if (typeof children === 'function') {
    if (!autorise && mode === 'hide') return null
    return <>{children(autorise, motif)}</>
  }
  if (!autorise) return null
  return <>{children}</>
}

/** Route protégée par permission : navigation directe → page 403. */
export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const can = useCan()
  const location = useLocation()
  if (!can(permission)) {
    return <Navigate to="/403" replace state={{ motif: motifRefus(permission), depuis: location.pathname }} />
  }
  return <>{children}</>
}
