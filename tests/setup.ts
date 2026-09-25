import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { createMockServer } from '@/api/mocks/node';
import { reinitialiserDb } from '@/mock-backend/db';

const server = createMockServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  reinitialiserDb();
});

afterAll(() => {
  server.close();
});
