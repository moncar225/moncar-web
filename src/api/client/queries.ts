import { useQuery, type QueryClient, type UseQueryOptions } from '@tanstack/react-query';
import {
  fetchHealth,
  fetchCompagnieActivity,
  fetchCompagnieEvents,
  fetchCompagnieStats,
  type DashboardEnvelope,
  type HealthResponse,
} from './demoServices';
import type { ApiError } from '../errors';
import type { ActivityItem, EventItem, StatCard } from '@/features/compagnie/mock/dashboard';

export const queryKeys = {
  health: ['infra', 'health'] as const,
  compagnieDashboard: {
    stats: ['demo', 'compagnie', 'dashboard', 'stats'] as const,
    activity: ['demo', 'compagnie', 'dashboard', 'activity'] as const,
    events: ['demo', 'compagnie', 'dashboard', 'events'] as const,
  },
  adminDashboard: {
    stats: ['demo', 'admin', 'dashboard', 'stats'] as const,
    activity: ['demo', 'admin', 'dashboard', 'activity'] as const,
  },
  businessDashboard: {
    stats: ['demo', 'business', 'dashboard', 'stats'] as const,
    activity: ['demo', 'business', 'dashboard', 'activity'] as const,
  },
} as const;

export function invalidateDashboard(queryClient: QueryClient, space: 'compagnie' | 'admin' | 'business'): void {
  const roots = {
    compagnie: queryKeys.compagnieDashboard,
    admin: queryKeys.adminDashboard,
    business: queryKeys.businessDashboard,
  } as const;
  for (const root of Object.values(roots[space])) {
    void queryClient.invalidateQueries({ queryKey: root });
  }
}

type QueryOpts<TData, TQueryKey extends readonly unknown[]> = Omit<
  UseQueryOptions<TData, ApiError, TData, TQueryKey>,
  'queryKey' | 'queryFn'
>;

export function useHealthQuery(options: QueryOpts<HealthResponse, typeof queryKeys.health> = {}) {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: fetchHealth,
    staleTime: 60_000,
    ...options,
  });
}

export function useCompagnieStatsQuery(
  options: QueryOpts<DashboardEnvelope<StatCard[]>, typeof queryKeys.compagnieDashboard.stats> = {},
) {
  return useQuery({
    queryKey: queryKeys.compagnieDashboard.stats,
    queryFn: fetchCompagnieStats,
    ...options,
  });
}

export function useCompagnieActivityQuery(
  options: QueryOpts<DashboardEnvelope<ActivityItem[]>, typeof queryKeys.compagnieDashboard.activity> = {},
) {
  return useQuery({
    queryKey: queryKeys.compagnieDashboard.activity,
    queryFn: fetchCompagnieActivity,
    ...options,
  });
}

export function useCompagnieEventsQuery(
  options: QueryOpts<DashboardEnvelope<EventItem[]>, typeof queryKeys.compagnieDashboard.events> = {},
) {
  return useQuery({
    queryKey: queryKeys.compagnieDashboard.events,
    queryFn: fetchCompagnieEvents,
    ...options,
  });
}
