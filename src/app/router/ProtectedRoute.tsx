import type { ReactNode } from 'react'
import { AuthGuard } from './AuthGuard'
import { PermissionGuard } from './PermissionGuard'
import type { Role } from '@/types/auth'

/**
 * Route protégée MON CAR : AuthGuard (session) puis PermissionGuard (rôle).
 * États couverts : loading, unauthenticated, forbidden, authenticated.
 */
export function ProtectedRoute({ requiredRole, children }: { requiredRole: Role; children: ReactNode }) {
  return (
    <AuthGuard>
      <PermissionGuard requiredRole={requiredRole}>{children}</PermissionGuard>
    </AuthGuard>
  )
}
