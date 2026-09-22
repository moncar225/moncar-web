import { setupWorker, type SetupWorker } from 'msw/browser';
import { handlers } from './handlers';

let workerRef: SetupWorker | null = null;

export async function enableMocks(): Promise<SetupWorker> {
  if (workerRef === null) {
    workerRef = setupWorker(...handlers);
  }
  await workerRef.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
  return workerRef;
}

export function isMockEnabled(flag: boolean): boolean {
  return flag;
}
