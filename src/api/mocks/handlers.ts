import type { HttpHandler } from 'msw';
import { mockBackendHandlers } from '@/mock-backend/handlers';
import { demoHandlers } from './handlers/demo';
import { errorHandlers } from './handlers/errors';

/**
 * Handlers MSW : faux backend MON CAR (chemins de la roadmap §9, en attendant
 * le contrat OpenAPI) + démonstrations techniques + galerie d'erreurs.
 */
export const handlers: HttpHandler[] = [...mockBackendHandlers, ...demoHandlers, ...errorHandlers];
