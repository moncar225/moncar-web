import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import { env } from './lib/env'
import './index.css'

async function bootstrap() {
  if (env.enableMocks) {
    const { enableMocks } = await import('./api/mocks/browser')
    await enableMocks()
  }

  const root = document.getElementById('root')
  if (root === null) {
    throw new Error('Élément racine #root introuvable.')
  }
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

void bootstrap()
