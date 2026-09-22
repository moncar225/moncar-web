import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../providers/AuthProvider'
import type { Role } from '@/types/auth'

/**
 * Vérifie que la session authentifiée possède le rôle requis pour l'espace.
 * État `forbidden` : redirection vers /403.
 */
export function PermissionGuard({ requiredRole, children }: { requiredRole: Role; children: ReactNode }) {
  const { session } = useAuth()

  if (session !== null && session.roles.includes(requiredRole)) {
    return children
  }

  return <Navigate to="/403" replace />
}
