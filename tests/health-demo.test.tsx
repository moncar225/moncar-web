import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { HealthDemo } from '../src/components/demo/HealthDemo';

function withQueryClient(node: React.ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
  });
  return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

describe('HealthDemo (chaîne React → TanStack → API client → MSW)', () => {
  it('affiche le badge Connecté · MSW quand le handler MSW répond', async () => {
    render(withQueryClient(<HealthDemo />));

    expect(screen.getByTestId('health-demo')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Connecté · MSW/i)).toBeInTheDocument();
    }, { timeout: 5_000 });

    expect(screen.getByTestId('health-demo').querySelector('dl')).toBeInTheDocument();
    expect(screen.getByText(/remplacée par Prism/i)).toBeInTheDocument();
  });
});
