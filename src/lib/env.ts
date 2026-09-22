import { z } from 'zod'

/**
 * Variables d'environnement de moncar-web, validées au démarrage.
 * Aucun secret ici : tout ce qui commence par VITE_ est embarqué dans le bundle.
 */
const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default('MON CAR'),
  VITE_API_BASE_URL: z.union([z.url('VITE_API_BASE_URL doit être une URL valide.'), z.literal('')]).default(''),
  VITE_ENABLE_MOCKS: z
    .union([z.literal('true'), z.literal('false'), z.literal('')])
    .default('false'),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  throw new Error(`Variables d'environnement invalides : ${parsed.error.message}`)
}

export const env = {
  appName: parsed.data.VITE_APP_NAME,
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
  enableMocks: parsed.data.VITE_ENABLE_MOCKS === 'true',
} as const
