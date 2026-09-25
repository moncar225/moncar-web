import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { env } from './lib/env'
import { initMonitoring } from './lib/monitoring'
import './index.css'

async function bootstrap() {
  const rootOptions = await initMonitoring()

  // Condition statique : en production (VITE_ENABLE_MOCKS absent), le faux
  // backend n'est même pas inclus dans le build.
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true' && env.enableMocks) {
    const { enableMocks } = await import('./api/mocks/browser')
    await enableMocks()
  }

  const root = document.getElementById('root')
  if (root === null) {
    throw new Error('Élément racine #root introuvable.')
  }
  createRoot(root, rootOptions).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

void bootstrap()
