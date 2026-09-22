# services/ — clients API MON CAR

**⚠️ Aucun endpoint n'existe ici tant que le contrat OpenAPI du backend
(moncar-api, responsables : Richard/Lu) n'est pas fourni.**

Une fois le contrat disponible :

1. générer les clients TypeScript depuis la spécification OpenAPI
   (ne pas écrire les signatures à la main) ;
2. brancher chaque feature sur ses services générés via TanStack Query ;
3. centraliser la gestion des erreurs (401 session expirée, 403 interdit,
   404 introuvable, 409 conflit, 422 invalide, 429 trop de requêtes,
   500 erreur serveur + référence d'incident) avec des messages en français.

Ne jamais inventer un endpoint : si une information manque, elle est signalée.
