import { setupServer, type SetupServer } from 'msw/node';
import { handlers } from './handlers';

let serverRef: SetupServer | null = null;

export function createMockServer(): SetupServer {
  if (serverRef === null) {
    serverRef = setupServer(...handlers);
  }
  return serverRef;
}

export function getMockServer(): SetupServer {
  if (serverRef === null) return createMockServer();
  return serverRef;
}
