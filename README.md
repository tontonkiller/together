# Together — Calendrier familial partagé

Application web permettant aux familles et groupes de partager et visualiser leurs événements sur un calendrier commun.

## Fonctionnalités

- **Authentification** magic link (email) + Google OAuth
- **Groupes** : créer, inviter par lien ou email, gérer les membres
- **Événements** : créer, modifier, supprimer — journée entière ou créneau horaire
- **Calendrier personnel** avec vue multi-groupes
- **Calendrier de groupe** avec filtres par membre et code couleur
- **Événements privés** visibles uniquement par le créateur (affichés "Occupé" aux autres)
- **PWA** installable sur iOS et Android
- **Bilingue** FR / EN

## Stack technique

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| UI | MUI v7 (Material UI) + Emotion |
| Backend | Supabase (Auth, PostgreSQL, RLS, SECURITY DEFINER) |
| i18n | next-intl v4 (FR/EN, locale routing) |
| Tests | Vitest + Testing Library (React) + jsdom |
| Lint | ESLint 9 + eslint-config-next |
| Deploy | Vercel |

## Démarrage rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Appliquer le schéma Supabase
# Exécuter supabase/schema.sql dans le SQL Editor de votre projet Supabase
# Puis exécuter les migrations dans supabase/migrations/ dans l'ordre

# 4. Lancer le serveur de développement
npm run dev
```

L'app est accessible sur [http://localhost:3000](http://localhost:3000).

## Scripts

| Commande | Description |
|----------|------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | Lint ESLint |
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:watch` | Tests en mode watch |

## Structure du projet

```
src/
├── app/
│   ├── [locale]/           # Routes localisées (FR/EN)
│   │   ├── dashboard/      # Tableau de bord (groupes + événements)
│   │   ├── groups/         # Création et détail de groupe
│   │   ├── calendar/       # Calendrier personnel + multi-groupes
│   │   ├── profile/        # Profil utilisateur
│   │   ├── invite/         # Page d'acceptation d'invitation
│   │   └── login/          # Connexion magic link
│   └── api/invite/         # API d'invitation par code
├── components/             # Composants réutilisables (layout, error, PWA)
└── lib/
    ├── supabase/           # Clients Supabase (browser + server)
    ├── i18n/               # Configuration i18n + messages FR/EN
    ├── types/              # Interfaces TypeScript
    └── utils/              # Utilitaires (couleurs membres)

supabase/
├── schema.sql              # Schéma complet (tables, RLS, fonctions)
└── migrations/             # Migrations incrémentales
```

## Base de données

6 tables avec Row Level Security :

- **profiles** — Profils utilisateurs (extends auth.users)
- **groups** — Groupes avec code d'invitation unique
- **group_members** — Membres avec rôle (admin/member) et couleur
- **event_types** — Types d'événements (Vacances, Voyage, Disponible)
- **events** — Événements calendrier
- **invitations** — Invitations par email avec expiration 7 jours

## Tests

217 tests unitaires couvrant 24 fichiers de test :

```bash
npm test
```

## Licence

Privé.
