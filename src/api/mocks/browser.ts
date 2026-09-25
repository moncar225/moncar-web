import { getResponse } from 'msw';
import { setupWorker, type SetupWorker } from 'msw/browser';
import { handlers } from './handlers';

let workerRef: SetupWorker | null = null;
let fetchPatche = false;

/**
 * Repli sans service worker (navigation privée, navigateurs intégrés,
 * politiques d'entreprise) : `fetch` est intercepté dans la page et résolu
 * par les mêmes handlers ; les requêtes non gérées partent normalement.
 */
function intercepterFetch(): void {
  if (fetchPatche) return;
  fetchPatche = true;
  const fetchOriginal = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const requete = new Request(input, init);
    const reponse = await getResponse(handlers, requete.clone());
    return reponse ?? fetchOriginal(requete);
  };
}

export type ModeMocks = 'service-worker' | 'fetch';

export async function enableMocks(): Promise<ModeMocks> {
  try {
    if (workerRef === null) {
      workerRef = setupWorker(...handlers);
    }
    await workerRef.start({
      onUnhandledRequest: 'bypass',
      quiet: true,
    });
    return 'service-worker';
  } catch (erreur) {
    console.warn('[MON CAR] Service worker indisponible : faux backend servi par interception de fetch.', erreur);
    intercepterFetch();
    return 'fetch';
  }
}

export function isMockEnabled(flag: boolean): boolean {
  return flag;
}
