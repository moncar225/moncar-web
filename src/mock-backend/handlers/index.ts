import type { HttpHandler } from 'msw'
import { authHandlers } from './auth'
import { referentielsHandlers } from './referentiels'

/** ⚠️ FAUX BACKEND — tous les handlers métier (remplacés par l'API réelle). */
export const mockBackendHandlers: HttpHandler[] = [...authHandlers, ...referentielsHandlers]
