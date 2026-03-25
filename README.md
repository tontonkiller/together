# Together — Calendrier partagé

Application web permettant aux familles et groupes de partager et visualiser leurs événements sur un calendrier commun.

## Fonctionnalités

- **Authentification** magic link (email) + Google OAuth
- **Groupes** : créer, inviter par lien ou email, gérer les membres
- **Événements** : créer, modifier, supprimer — journée entière ou créneau horaire
- **Calendrier personnel** avec vue multi-groupes
- **Calendrier de groupe** avec filtres par membre et code couleur
- **Événements privés** visibles uniquement par le créateur (affichés "Occupé" aux autres)
- **Synchronisation Google Calendar** : import one-way, multi-comptes, sync automatique, badge "G"
- **Upload photo** : avatar utilisateur et photo de groupe via Supabase Storage
- **Mode Eva** : thème alternatif rose/pink avec toggle dans la TopBar
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
│   ├── [locale]/
│   │   ├── (authenticated)/
│   │   │   ├── dashboard/      # Tableau de bord (groupes + événements)
│   │   │   ├── groups/         # Création et détail de groupe
│   │   │   ├── calendar/       # Calendrier personnel + multi-groupes
│   │   │   ├── google-sync/    # Page synchronisation Google Calendar
│   │   │   └── profile/        # Profil utilisateur + sélection calendriers Google
│   │   ├── auth/               # Callback auth (magic link + Google OAuth)
│   │   ├── invite/             # Page d'acceptation d'invitation
│   │   └── login/              # Connexion magic link + Google OAuth
│   └── api/
│       ├── google/             # API Google (connect, callback, calendars, sync, disconnect)
│       └── invite/             # API d'invitation par code
├── components/
│   ├── error/                  # RouteErrorBoundary
│   ├── google/                 # AutoSync
│   ├── layout/                 # AuthenticatedLayout, TopBar, BottomNav, ThemeRegistry
│   └── pwa/                    # ServiceWorkerRegistration
└── lib/
    ├── google/                 # OAuth tokens, calendar API, sync engine
    ├── hooks/                  # useImageUpload
    ├── i18n/                   # Configuration i18n + messages FR/EN
    ├── supabase/               # Clients Supabase (browser + server + middleware)
    ├── types/                  # Interfaces TypeScript
    └── utils/                  # Utilitaires (couleurs membres, contraste texte)

supabase/
├── schema.sql                  # Schéma complet (tables, RLS, fonctions)
└── migrations/                 # Migrations incrémentales
```

## Base de données

9 tables avec Row Level Security :

- **profiles** — Profils utilisateurs (extends auth.users)
- **groups** — Groupes avec code d'invitation unique
- **group_members** — Membres avec rôle (admin/member) et couleur
- **event_types** — Types d'événements (Vacances, Voyage, Disponible)
- **events** — Événements calendrier
- **invitations** — Invitations par email avec expiration 7 jours
- **google_accounts** — Comptes Google connectés (OAuth tokens)
- **google_calendars** — Calendriers Google sélectionnés pour la sync
- **google_synced_events** — Événements importés depuis Google Calendar

## Tests

223 tests unitaires couvrant 24 fichiers de test :

```bash
npm test
```

## Licence

Privé.
