import type { HttpHandler } from 'msw';
import { demoHandlers } from './handlers/demo';
import { errorHandlers } from './handlers/errors';

export const handlers: HttpHandler[] = [...demoHandlers, ...errorHandlers];
