import { httpClient } from '@/api/client';
import type { ActivityItem, EventItem, StatCard } from '@/features/compagnie/mock/dashboard';

export interface HealthResponse {
  status: 'ok';
  service: string;
  mock?: boolean;
  note?: string;
}

export interface DashboardEnvelope<TData> {
  mock: boolean;
  contractPending: boolean;
  data: TData;
}

export async function fetchHealth(): Promise<HealthResponse> {
  return httpClient.get<HealthResponse>('/health');
}

export async function fetchCompagnieStats(): Promise<DashboardEnvelope<StatCard[]>> {
  return httpClient.get('/mock/compagnie/dashboard/stats');
}

export async function fetchCompagnieActivity(): Promise<DashboardEnvelope<ActivityItem[]>> {
  return httpClient.get('/mock/compagnie/dashboard/activity');
}

export async function fetchCompagnieEvents(): Promise<DashboardEnvelope<EventItem[]>> {
  return httpClient.get('/mock/compagnie/dashboard/events');
}

export async function fetchAdminStats(): Promise<DashboardEnvelope<StatCard[]>> {
  return httpClient.get('/mock/admin/dashboard/stats');
}

export async function fetchAdminActivity(): Promise<DashboardEnvelope<ActivityItem[]>> {
  return httpClient.get('/mock/admin/dashboard/activity');
}

export async function fetchBusinessStats(): Promise<DashboardEnvelope<StatCard[]>> {
  return httpClient.get('/mock/business/dashboard/stats');
}

export async function fetchBusinessActivity(): Promise<DashboardEnvelope<ActivityItem[]>> {
  return httpClient.get('/mock/business/dashboard/activity');
}
