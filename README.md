# moncar-web

Plateforme web **MON CAR** (transport · colis · location de véhicules) —
espaces **Compagnie**, **Business** et **Administration**.

Dépôt séparé du mobile (`moncar-mobile`, Flutter) et du backend (`moncar-api`,
Symfony — **ne jamais modifier depuis ici**).

## Stack

React 19 · Vite · TypeScript strict · React Router 7 · TanStack Query 5 ·
React Hook Form + Zod · ESLint 9 · Vitest 5 · MSW (mocks, pour tests uniquement).

## Commandes

```bash
npm install        # dépendances
npm run dev        # serveur de développement
npm run build      # typecheck strict (tsc -b) + build de production
npm run lint       # ESLint (strict : pas de any, pas de console, etc.)
npm run typecheck  # tsc seul
npm run test       # Vitest (pool forks, jsdom)
```

## Structure

```
src/
├── app/
│   ├── router/        # routes, ProtectedRoute, AuthGuard, PermissionGuard
│   ├── providers/     # AppProviders (TanStack Query), AuthProvider (sans endpoint)
│   └── layouts/       # CompanyLayout, BusinessLayout, AdminLayout (lazy)
├── components/        # composants partagés (PageLoader…) + démo technique
├── features/          # home, compagnie/, business/, admin/, errors/
├── hooks/             # hooks réutilisables (useDocumentTitle…)
├── lib/               # env validée par Zod, futurs utilitaires
├── services/          # ⚠️ vide tant que le contrat OpenAPI n'est pas fourni
├── types/             # types partagés (auth…)
└── main.tsx
tests/                 # Vitest + Testing Library
```

## Routing

| Route | Accès |
|---|---|
| `/` | Public (accueil + démonstration technique RHF/Zod) |
| `/compagnie/*` | Protégé, rôle `compagnie`, lazy loading |
| `/business/*` | Protégé, rôle `business`, lazy loading |
| `/admin/*` | Protégé, rôle `admin`, lazy loading |
| `/403` · `/404` | Publiques |

États des guards : `loading` · `authenticated` · `unauthenticated` · `forbidden`.
**Aucun endpoint n'est appelé** : l'authentification réelle attend le contrat
OpenAPI du backend (source de vérité). Aucun endpoint ne doit être inventé.

## Environnement

Copier `.env.example` vers `.env.local` — uniquement des variables non secrètes
(`VITE_APP_NAME`, `VITE_API_BASE_URL`, `VITE_ENABLE_MOCKS`).
