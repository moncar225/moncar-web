import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { createMockServer } from '@/api/mocks/node';
import { reinitialiserDb } from '@/mock-backend/db';
import { sessionManager } from '@/api/client';

// jsdom n'implémente pas <dialog>.showModal/close : remplacement minimal.
if (typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}

// Pages chargées à la demande + faux backend : sous charge, plus d'1 s.
configure({ asyncUtilTimeout: 5000 });

const server = createMockServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'bypass' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  reinitialiserDb();
  sessionManager.clear();
});

afterAll(() => {
  server.close();
});
