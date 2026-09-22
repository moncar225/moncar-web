import { http, HttpResponse, type HttpHandler } from 'msw';
import { compagnieStats, compagnieActivity, compagnieEvents } from '@/features/compagnie/mock/dashboard';
import { adminStats, adminActivity } from '@/features/admin/mock/dashboard';
import { businessStats, businessActivity } from '@/features/business/mock/dashboard';

const health = http.get('*/health', () => {
  return HttpResponse.json({
    status: 'ok',
    service: 'moncar-api',
    mock: true,
    note: 'Réponse MSW temporaire — remplacée par Prism / API réelle une fois le contrat OpenAPI livré (Richard, Sprint 1 J5-J6).',
  });
});

const compagnieDashboardStats = http.get('*/mock/compagnie/dashboard/stats', () => {
  return HttpResponse.json({
    mock: true,
    contractPending: true,
    data: compagnieStats,
  });
});

const compagnieDashboardActivity = http.get('*/mock/compagnie/dashboard/activity', () => {
  return HttpResponse.json({
    mock: true,
    contractPending: true,
    data: compagnieActivity,
  });
});

const compagnieDashboardEvents = http.get('*/mock/compagnie/dashboard/events', () => {
  return HttpResponse.json({
    mock: true,
    contractPending: true,
    data: compagnieEvents,
  });
});

const adminDashboardStats = http.get('*/mock/admin/dashboard/stats', () => {
  return HttpResponse.json({
    mock: true,
    contractPending: true,
    data: adminStats,
  });
});

const adminDashboardActivity = http.get('*/mock/admin/dashboard/activity', () => {
  return HttpResponse.json({
    mock: true,
    contractPending: true,
    data: adminActivity,
  });
});

const businessDashboardStats = http.get('*/mock/business/dashboard/stats', () => {
  return HttpResponse.json({
    mock: true,
    contractPending: true,
    data: businessStats,
  });
});

const businessDashboardActivity = http.get('*/mock/business/dashboard/activity', () => {
  return HttpResponse.json({
    mock: true,
    contractPending: true,
    data: businessActivity,
  });
});

export const demoHandlers: HttpHandler[] = [
  health,
  compagnieDashboardStats,
  compagnieDashboardActivity,
  compagnieDashboardEvents,
  adminDashboardStats,
  adminDashboardActivity,
  businessDashboardStats,
  businessDashboardActivity,
];
