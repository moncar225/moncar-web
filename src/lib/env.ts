import { z } from 'zod'

/**
 * Variables d'environnement de moncar-web, validées au démarrage.
 * Aucun secret ici : tout ce qui commence par VITE_ est embarqué dans le bundle.
 *
 * Environnements de compilation (roadmap Sprint 1) : `.env.development`
 * (npm run dev), `.env.recette` (npm run build:recette), `.env.production`
 * (npm run build).
 */
const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default('MON CAR'),
  VITE_APP_ENV: z.enum(['dev', 'recette', 'prod']).default('dev'),
  VITE_API_BASE_URL: z.union([z.url('VITE_API_BASE_URL doit être une URL valide.'), z.literal('')]).default(''),
  VITE_ENABLE_MOCKS: z
    .union([z.literal('true'), z.literal('false'), z.literal('')])
    .default('false'),
  // DSN Sentry : vide = supervision désactivée (poste de dev, tests).
  VITE_SENTRY_DSN: z.union([z.url('VITE_SENTRY_DSN doit être une URL valide.'), z.literal('')]).default(''),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  throw new Error(`Variables d'environnement invalides : ${parsed.error.message}`)
}

const APP_ENV_LABELS = {
  dev: 'Développement',
  recette: 'Recette',
  prod: 'Production',
} as const

export const env = {
  appName: parsed.data.VITE_APP_NAME,
  appEnv: parsed.data.VITE_APP_ENV,
  appEnvLabel: APP_ENV_LABELS[parsed.data.VITE_APP_ENV],
  isProd: parsed.data.VITE_APP_ENV === 'prod',
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
  enableMocks: parsed.data.VITE_ENABLE_MOCKS === 'true',
  sentryDsn: parsed.data.VITE_SENTRY_DSN,
} as const
