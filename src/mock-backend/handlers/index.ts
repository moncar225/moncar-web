import type { HttpHandler } from 'msw'
import { authHandlers } from './auth'
import { businessHandlers } from './business'
import { exploitationHandlers } from './exploitation'
import { gareHandlers } from './gare'
import { plateformeHandlers } from './plateforme'
import { venteHandlers } from './vente'
import { referentielsHandlers } from './referentiels'

/** ⚠️ FAUX BACKEND — tous les handlers métier (remplacés par l'API réelle). */
export const mockBackendHandlers: HttpHandler[] = [...authHandlers, ...referentielsHandlers, ...exploitationHandlers, ...venteHandlers, ...gareHandlers, ...plateformeHandlers, ...businessHandlers]
