import { http, HttpResponse, type HttpHandler } from 'msw';
import { HTTP_STATUS } from '@/api/errors';

const unprocessable = http.post('*/fixtures/errors/422', () => {
  return HttpResponse.json(
    {
      message: 'Les données envoyées sont invalides.',
      errors: [
        { field: 'email', message: 'Adresse e-mail invalide.' },
        { field: 'password', message: 'Le mot de passe doit contenir au moins 8 caractères.' },
      ],
    },
    { status: HTTP_STATUS.UNPROCESSABLE_ENTITY },
  );
});

const unauthorized = http.get('*/fixtures/errors/401', () => {
  return HttpResponse.json(
    { message: 'Token invalide ou expiré.' },
    { status: HTTP_STATUS.UNAUTHORIZED },
  );
});

const forbidden = http.get('*/fixtures/errors/403', () => {
  return HttpResponse.json(
    { message: 'Permission insuffisante sur cette ressource.' },
    { status: HTTP_STATUS.FORBIDDEN },
  );
});

const conflict = http.post('*/fixtures/errors/409', () => {
  return HttpResponse.json(
    { message: 'Conflit de version : les données ont été modifiées entre-temps.' },
    { status: HTTP_STATUS.CONFLICT },
  );
});

const tooMany = http.get('*/fixtures/errors/429', () => {
  return HttpResponse.json(
    { message: 'Limite de requêtes atteinte.' },
    { status: HTTP_STATUS.TOO_MANY_REQUESTS, headers: { 'Retry-After': '30' } },
  );
});

const serverError = http.get('*/fixtures/errors/500', () => {
  return HttpResponse.json(
    {
      message: 'Erreur interne du serveur.',
      incidentId: 'INC-MOCK-500-20260923-0001',
    },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: { 'X-Request-Id': 'REQ-MOCK-500-0001' } },
  );
});

export const errorHandlers: HttpHandler[] = [
  unprocessable,
  unauthorized,
  forbidden,
  conflict,
  tooMany,
  serverError,
];
