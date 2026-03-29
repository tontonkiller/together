# Together — Spécifications complètes

> Application de calendrier partagé pour familles et groupes.
> Dernière mise à jour : 29 mars 2026

---

## Table des matières

1. [Vision & objectif](#1-vision--objectif)
2. [Stack technique](#2-stack-technique)
3. [Architecture](#3-architecture)
4. [Authentification](#4-authentification)
5. [Profil utilisateur](#5-profil-utilisateur)
6. [Groupes](#6-groupes)
7. [Invitations](#7-invitations)
8. [Événements](#8-événements)
9. [Calendrier](#9-calendrier)
10. [Google Calendar Sync](#10-google-calendar-sync)
11. [Bob — Assistant vocal](#11-bob--assistant-vocal)
12. [Thèmes](#12-thèmes)
13. [Internationalisation (i18n)](#13-internationalisation-i18n)
14. [PWA](#14-pwa)
15. [Base de données](#15-base-de-données)
16. [API Routes](#16-api-routes)
17. [Pages & Navigation](#17-pages--navigation)
18. [Sécurité (RLS)](#18-sécurité-rls)
19. [Tests](#19-tests)
20. [Déploiement](#20-déploiement)

---

## 1. Vision & objectif

**Together** permet à des familles, groupes d'amis ou clubs de partager un calendrier commun. Chaque membre voit les événements de tous les co-membres sur une vue unifiée.

**Proposition de valeur :**
- Créer des calendriers partagés par groupe
- Visualiser les événements de tous les membres
- Importer ses événements Google Calendar
- Créer des événements par la voix (assistant Bob)
- Installable comme app native (PWA)

---

## 2. Stack technique

| Couche | Technologie | Rôle |
|--------|-------------|------|
| Framework | Next.js 16.2 (App Router) | Full-stack React avec Server Components |
| Frontend | React 19 + TypeScript 5 | Composants UI + typage |
| UI | MUI v7 + Emotion | Material Design + CSS-in-JS |
| Backend | Supabase (PostgreSQL) | BDD + Auth + RLS + Storage |
| Auth | Supabase Auth | Magic link + Google OAuth 2.0 |
| i18n | next-intl v4 | Routing par locale + traductions |
| Tests | Vitest 4 + Testing Library | Tests unitaires + tests React |
| Lint | ESLint 9 + eslint-config-next | Qualité du code |
| Déploiement | Vercel | Hosting serverless |
| IA / Voix | Claude API + OpenAI Whisper | Parsing d'événements + transcription |
| Google APIs | Google Calendar API v3 | Synchronisation calendrier |

---

## 3. Architecture

### Structure du projet

```
src/
├── app/
│   ├── [locale]/                      # Routing par locale (fr/en)
│   │   ├── (authenticated)/           # Routes protégées
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   ├── groups/
│   │   │   │   ├── new/
│   │   │   │   └── [id]/
│   │   │   ├── calendar/
│   │   │   ├── google-sync/
│   │   │   └── bob/
│   │   ├── login/
│   │   └── invite/[code]/
│   ├── api/
│   │   ├── [locale]/auth/callback/
│   │   ├── google/
│   │   │   ├── connect/
│   │   │   ├── callback/
│   │   │   ├── calendars/
│   │   │   ├── sync/
│   │   │   └── disconnect/
│   │   ├── bob/
│   │   │   ├── transcribe/
│   │   │   ├── parse/
│   │   │   └── create/
│   │   └── invite/[code]/
│   ├── layout.tsx
│   └── manifest.ts
├── components/
│   ├── layout/          (TopBar, BottomNav, AuthenticatedLayout, ThemeRegistry)
│   ├── google/          (AutoSync)
│   ├── pwa/             (ServiceWorkerRegistration)
│   └── error/           (RouteErrorBoundary)
├── lib/
│   ├── google/          (sync, calendar, tokens, getAccessToken)
│   ├── supabase/        (client, server, middleware)
│   ├── i18n/            (config, routing, navigation, messages/)
│   ├── types/           (events.ts)
│   ├── hooks/           (useImageUpload)
│   ├── utils/           (colors)
│   └── theme.ts
└── __tests__/           (24 fichiers, 219+ tests)

supabase/
├── schema.sql
└── migrations/          (10 migrations)

public/
├── icons/               (192x192, 512x512)
└── sw.js                (Service Worker)
```

---

## 4. Authentification

### Magic Link (Email OTP)

1. L'utilisateur entre son email sur `/login`
2. Supabase envoie un email avec un lien OTP
3. Clic sur le lien → `/{locale}/auth/callback?code=...`
4. L'API échange le code contre une session
5. Création automatique du profil si premier login (display_name = préfixe email)
6. Redirection vers `/dashboard` (ou paramètre `?next=`)

### Google OAuth

1. Clic sur "Continuer avec Google" sur `/login`
2. Supabase initie le flow OAuth avec Google
3. Après consentement, callback vers `/{locale}/auth/callback`
4. Même flow que magic link (échange code → session → profil)

### Gestion de session

- Session gérée par Supabase côté client et serveur
- Middleware Next.js rafraîchit la session à chaque requête
- Déconnexion via le profil

---

## 5. Profil utilisateur

**Page :** `/profile`

| Champ | Type | Modifiable | Stockage |
|-------|------|------------|----------|
| Nom d'affichage | Texte | Oui | Supabase (profiles) |
| Email | Texte | Non (lecture seule) | auth.users |
| Avatar | Image | Oui (upload) | Supabase Storage (bucket `avatars`) |
| Langue | FR / EN | Oui | Supabase (profiles.preferred_locale) |

### Upload d'avatar

- Redimensionnement côté client (256x256)
- Stockage dans Supabase Storage : `avatars/{user_id}/avatar.jpg`
- Hook personnalisé `useImageUpload`

### Comptes Google connectés

- Liste des comptes Google liés (email affiché)
- Bouton "Connecter un compte Google" → OAuth
- Bouton "Déconnecter" → suppression en cascade
- Sélection des calendriers à synchroniser par compte (checkboxes)

---

## 6. Groupes

### Création

1. Clic sur "Nouveau groupe" depuis le dashboard
2. Saisie du nom (obligatoire) et de la description (optionnelle)
3. Le créateur devient automatiquement **admin**
4. Un code d'invitation unique est généré (6 octets → hex, 12 caractères)
5. Redirection vers la page du groupe

### Rôles

| Rôle | Droits |
|------|--------|
| **Admin** | Inviter, renommer, modifier la description, kicker des membres, supprimer le groupe, gérer les invitations |
| **Membre** | Voir le groupe, quitter, créer des événements, voir les co-membres |

### Fonctionnalités admin

- **Renommer le groupe** : dialog inline (nom + description)
- **Modifier la description** : même dialog
- **Kicker un membre** : icône de suppression sur les non-admins, dialog de confirmation
- **Supprimer le groupe** : réservé à l'admin
- **Gérer les invitations** : voir les invitations en attente, révoquer
- **Transfert d'admin** : automatique au membre le plus ancien si l'admin quitte

### Avatar de groupe

- Upload d'image pour le groupe
- Stockage : `group-avatars/{group_id}/avatar.jpg`
- Seuls les admins peuvent modifier l'avatar

### Couleurs des membres

- 15 couleurs disponibles : `#2196F3, #FF5252, #4CAF50, #FF9800, #AB47BC, #EC407A, #26C6DA, #FFCA28, #5D4037, #3F51B5, #26A69A, #FF7043, #78909C, #8BC34A, #F06292`
- Attribution automatique à l'ordre d'arrivée
- Affichées dans la liste des membres et les filtres du calendrier

---

## 7. Invitations

### Par lien

- URL partageable : `/invite/{code}`
- Si l'utilisateur est authentifié → rejoint automatiquement le groupe
- Si non authentifié → page de login puis redirection
- Couleur de membre auto-assignée depuis la palette

### Par email (admin)

- L'admin saisit l'email de la personne à inviter
- Création d'un enregistrement `invitations` (expire après 7 jours)
- Statut : `pending` → `accepted` ou `expired`
- Vue admin : invitations en attente + qui a invité

### Expiration

- Durée de validité : **7 jours** (défaut SQL : `now() + interval '7 days'`)
- Statut automatiquement `expired` après la date

---

## 8. Événements

### Propriétés

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| Titre | Texte (max 200 car.) | Oui | Nom de l'événement |
| Description | Texte | Non | Détails |
| Lieu | Texte | Non | Localisation |
| Date de début | Date | Oui | — |
| Date de fin | Date | Oui | ≥ date de début |
| Heure de début | Heure | Si pas all-day | — |
| Heure de fin | Heure | Si pas all-day | — |
| Journée entière | Booléen | — | Défaut : true |
| Privé | Booléen | — | Défaut : false |
| Type | Référence | Non | Type d'événement |

### Types d'événements (système)

| Nom | Icône MUI | Description |
|-----|-----------|-------------|
| Vacances | BeachAccess | Congés / vacances |
| Disponible | EventAvailable | Disponibilité |
| Voyage | Flight | Déplacement |

Les utilisateurs peuvent aussi créer des **types personnalisés**.

### Événements privés

- Marqués `is_private = true`
- Visibles dans le calendrier des co-membres comme **"Occupé"** (titre et détails masqués côté client)
- Le RLS autorise l'accès — c'est le **client** qui redacte les informations

### CRUD

- **Créer** : formulaire avec tous les champs
- **Modifier** : seul le propriétaire peut éditer
- **Supprimer** : seul le propriétaire peut supprimer
- **Voir** : clic sur un événement → modal de détail

---

## 9. Calendrier

### Vue personnelle (`/calendar`)

- Affiche les événements de l'utilisateur + ceux de tous ses co-membres (tous groupes confondus)
- **Filtres** :
  - Par groupe (chips sélectionnables)
  - Par membre (chips avec couleurs des membres, toggle on/off)

### Vue de groupe (`/groups/[id]`)

- Affiche les événements de tous les membres du groupe
- Mêmes filtres que la vue personnelle

### Rendu visuel

| Type d'événement | Affichage |
|-------------------|-----------|
| Journée entière | Barre colorée pleine largeur |
| Avec horaires | Préfixe horaire + bordure gauche colorée |
| Importé Google | Badge **"G"** |
| Privé (co-membre) | Titre : "Occupé" |

### Responsive

- Mobile (375px+) : cellules de calendrier réduites
- Desktop : vue étendue avec plus de détails
- Dialogs plein écran sur mobile

---

## 10. Google Calendar Sync

### Principe

- Synchronisation **unidirectionnelle** : Google → Together
- Support **multi-comptes** (perso + pro)
- Fenêtre de sync : **6 mois glissants**
- Scope OAuth : `calendar.readonly`

### Connexion d'un compte Google

1. Depuis `/profile`, clic sur "Connecter un compte Google"
2. `POST /api/google/connect` → génère l'URL OAuth
3. Consentement Google (scope `calendar.readonly`)
4. Callback `GET /api/google/callback` → sauvegarde tokens
5. Redirection vers `/profile?connected=true`

### Sélection des calendriers

- L'utilisateur voit la liste de ses calendriers Google
- Checkbox pour activer/désactiver chaque calendrier
- Seuls les calendriers activés sont synchronisés

### Synchronisation automatique

- Déclenchée à **l'ouverture de l'app** (composant `AutoSync`)
- **Debounce de 5 minutes** (via `localStorage`)
- Aussi déclenchable manuellement depuis `/google-sync`

### Moteur de sync (`src/lib/google/sync.ts`)

```
fetchAndSyncEvents(supabase, userId) → { newPending, updated, deleted }
```

Pour chaque calendrier activé :
1. Rafraîchit le token d'accès si expiré
2. Appel Google Calendar API : `events.list(timeMin, timeMax, singleEvents=true)`
3. Expand des événements récurrents en instances individuelles
4. Comparaison avec les `google_synced_events` existants :
   - **Nouveau** → insert avec `status = 'pending'`
   - **Modifié** → mise à jour des données ; si accepté, met à jour l'événement Together
   - **Supprimé sur Google** → supprime l'événement Together si accepté, puis supprime le sync record

### Page de suggestions (`/google-sync`)

- Liste des événements synchronisés en attente (`status = 'pending'`)
- Pour chaque événement :
  - Checkbox d'acceptation/refus
  - Choix de visibilité : **"Détails"** (infos complètes) ou **"Occupé"** (busy)
- Actions en lot disponibles
- Accepter → crée l'événement Together + lie via `event_id`

### Déconnexion d'un compte Google

1. Clic sur "Déconnecter" depuis `/profile`
2. Appel à la fonction `delete_events_for_google_account()` (SECURITY DEFINER)
3. Suppression en cascade : événements Together → synced events → calendriers → compte Google

### Gestion des tokens

| Token | Durée de vie | Stockage |
|-------|-------------|----------|
| Access token | ~1 heure | `google_accounts.access_token` |
| Refresh token | Longue durée | `google_accounts.refresh_token` |
| Expiration | Trackée | `google_accounts.token_expires_at` |

---

## 11. Bob — Assistant vocal

**Page :** `/bob`

### Principe

Bob permet de créer des événements par la voix en langage naturel.

### Flow

1. L'utilisateur appuie sur le bouton micro
2. Le navigateur demande la permission micro
3. Enregistrement audio (format WebM/Opus)
4. Arrêt de l'enregistrement au tap
5. `POST /api/bob/transcribe` → Whisper API → texte transcrit
6. `POST /api/bob/parse` → Claude API → JSON structuré d'événement
7. Carte de confirmation avec les détails parsés
8. Sur confirmation, `POST /api/bob/create` → création de l'événement

### États de l'interface

| État | Description |
|------|-------------|
| `idle` | Prêt à écouter (tap micro) |
| `listening` | Enregistrement en cours (tap pour arrêter) |
| `processing` | Transcription + parsing en cours |
| `confirm` | Carte de confirmation affichée |
| `success` | Checkmark + auto-dismiss |
| `error` | Message d'erreur (permission micro, erreur API, pas de parole détectée) |

### Validations

- Taille minimum audio : 1000 octets (détection silence)
- Titre : obligatoire, max 200 caractères
- Dates : format YYYY-MM-DD
- Heures : format HH:MM
- Heures requises uniquement si pas journée entière

### Technologies

- **Transcription** : OpenAI Whisper API
- **Parsing** : Anthropic Claude API
- L'audio est envoyé au serveur, pas de traitement côté client

---

## 12. Thèmes

### Thème par défaut

- Palette cyan/teal méditerranéenne
- Couleur primaire : `#0891B2`
- Background : `#F0FAFB`

### Thème Eva

- Palette rose/pink coucher de soleil
- Activé via l'icône cœur dans la TopBar (vide → plein)
- Persisté dans `localStorage`
- Changement en temps réel (CSS-in-JS via Emotion)

### Implémentation

- `ThemeRegistry` gère le contexte Eva
- Deux thèmes MUI complets définis dans `src/lib/theme.ts`
- Toggle dans la `TopBar` (icône cœur)

---

## 13. Internationalisation (i18n)

### Configuration

- **Framework** : next-intl v4
- **Langues** : Français (fr, défaut) et Anglais (en)
- **Routing** : préfixe de locale (`/fr/dashboard`, `/en/dashboard`)

### Fichiers de traduction

- `src/lib/i18n/messages/fr.json`
- `src/lib/i18n/messages/en.json`
- ~100+ clés de traduction

### Namespaces

| Namespace | Contenu |
|-----------|---------|
| `nav` | Navigation |
| `auth` | Authentification |
| `common` | UI commune |
| `groups` | Groupes |
| `events` | Événements |
| `calendar` | Calendrier |
| `googleSync` | Synchronisation Google |
| `bob` | Assistant vocal |
| `invite` | Invitations |

### Usage

```tsx
const t = useTranslations('namespace');
t('key');
```

### Sélection de langue

- Sélecteur dans la TopBar
- Change la locale dans l'URL + met à jour `profiles.preferred_locale`

---

## 14. PWA

### Manifest (`src/app/manifest.ts`)

| Propriété | Valeur |
|-----------|--------|
| name | Together |
| short_name | Together |
| start_url | /dashboard |
| display | standalone |
| theme_color | #0891B2 |
| background_color | #F0FAFB |
| Icônes | 192x192 (maskable) + 512x512 (any) |

### Service Worker (`public/sw.js`)

| Stratégie | Cibles |
|-----------|--------|
| Cache-first | Assets statiques (CSS, JS, fonts) |
| Network-first | Navigation + requêtes API |
| Fallback offline | Page de secours |

### Installation

- **iOS** : "Ajouter à l'écran d'accueil" (via meta tags)
- **Android** : Prompt d'installation natif + manifest

### Stockage local

| Donnée | Mécanisme |
|--------|-----------|
| Préférence de thème | localStorage (`eva_mode`) |
| Debounce sync Google | localStorage (`lastGoogleSync`) |
| Session auth | Supabase (cookies) |

---

## 15. Base de données

### Schéma (9 tables)

#### profiles
| Colonne | Type | Contrainte |
|---------|------|------------|
| id | uuid | PK, FK → auth.users ON DELETE CASCADE |
| display_name | text | NOT NULL |
| avatar_url | text | nullable |
| preferred_locale | text | 'fr' ou 'en', défaut 'fr' |
| created_at | timestamptz | auto |
| updated_at | timestamptz | trigger auto |

#### groups
| Colonne | Type | Contrainte |
|---------|------|------------|
| id | uuid | PK |
| name | text | NOT NULL |
| description | text | nullable |
| avatar_url | text | nullable |
| created_by | uuid | FK → profiles, NOT NULL |
| invite_code | text | UNIQUE, 12 car. hex |
| created_at | timestamptz | auto |
| updated_at | timestamptz | trigger auto |

#### group_members
| Colonne | Type | Contrainte |
|---------|------|------------|
| id | uuid | PK |
| group_id | uuid | FK → groups ON DELETE CASCADE |
| user_id | uuid | FK → profiles ON DELETE CASCADE |
| role | text | 'admin' ou 'member', défaut 'member' |
| color | text | Couleur hex du membre |
| joined_at | timestamptz | auto |
| **UNIQUE** | (group_id, user_id) | |
| **INDEX** | idx_group_members_user_id | |

#### event_types
| Colonne | Type | Contrainte |
|---------|------|------------|
| id | uuid | PK |
| name | text | NOT NULL |
| icon | text | nullable (nom d'icône MUI) |
| is_system | boolean | défaut false |
| created_by | uuid | FK → profiles, nullable |
| created_at | timestamptz | auto |

**Types système pré-chargés** : Vacances, Disponible, Voyage

#### events
| Colonne | Type | Contrainte |
|---------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → profiles ON DELETE CASCADE |
| event_type_id | uuid | FK → event_types, nullable |
| title | text | NOT NULL |
| description | text | nullable |
| location | text | nullable |
| start_date | date | NOT NULL |
| end_date | date | NOT NULL, ≥ start_date |
| start_time | time | nullable (requis si pas all-day) |
| end_time | time | nullable (requis si pas all-day) |
| is_all_day | boolean | défaut true |
| is_private | boolean | défaut false |
| created_at | timestamptz | auto |
| updated_at | timestamptz | trigger auto |

#### invitations
| Colonne | Type | Contrainte |
|---------|------|------------|
| id | uuid | PK |
| group_id | uuid | FK → groups ON DELETE CASCADE |
| invited_email | text | NOT NULL |
| invited_by | uuid | FK → profiles |
| status | text | 'pending' / 'accepted' / 'expired', défaut 'pending' |
| expires_at | timestamptz | défaut now() + 7 jours |
| created_at | timestamptz | auto |

#### google_accounts
| Colonne | Type | Contrainte |
|---------|------|------------|
| id | uuid | PK |
| user_id | uuid | FK → profiles ON DELETE CASCADE |
| google_email | text | NOT NULL |
| refresh_token | text | NOT NULL |
| access_token | text | nullable |
| token_expires_at | timestamptz | nullable |
| created_at | timestamptz | auto |
| updated_at | timestamptz | trigger auto |
| **UNIQUE** | (user_id, google_email) | |

#### google_calendars
| Colonne | Type | Contrainte |
|---------|------|------------|
| id | uuid | PK |
| google_account_id | uuid | FK → google_accounts ON DELETE CASCADE |
| google_calendar_id | text | NOT NULL |
| name | text | NOT NULL |
| color | text | nullable |
| is_enabled | boolean | défaut true |
| created_at | timestamptz | auto |
| **UNIQUE** | (google_account_id, google_calendar_id) | |

#### google_synced_events
| Colonne | Type | Contrainte |
|---------|------|------------|
| id | uuid | PK |
| google_calendar_id | uuid | FK → google_calendars ON DELETE CASCADE |
| google_event_id | text | NOT NULL |
| event_id | uuid | FK → events ON DELETE SET NULL, nullable |
| status | text | 'pending' / 'accepted' / 'refused', défaut 'pending' |
| visibility | text | 'details' / 'busy', défaut 'details' |
| title | text | nullable |
| description | text | nullable |
| location | text | nullable |
| start_date | date | |
| end_date | date | |
| start_time | time | nullable |
| end_time | time | nullable |
| is_all_day | boolean | |
| is_recurring | boolean | |
| recurring_event_id | text | nullable |
| google_updated_at | timestamptz | |
| last_synced_at | timestamptz | défaut now() |
| created_at | timestamptz | auto |
| updated_at | timestamptz | trigger auto |
| **UNIQUE** | (google_calendar_id, google_event_id) | |
| **INDEX** | idx_google_synced_events_calendar_event | |
| **INDEX** | idx_google_synced_events_event_id | |

### Fonctions SECURITY DEFINER

| Fonction | Retour | Rôle |
|----------|--------|------|
| `is_group_creator(group_id, user_id)` | boolean | Vérifie si l'utilisateur a créé le groupe |
| `has_pending_invitation(group_id, user_id)` | boolean | Vérifie si l'utilisateur a une invitation en attente |
| `is_group_member(group_id, user_id)` | boolean | Vérifie l'appartenance au groupe |
| `is_own_google_account(google_account_id)` | boolean | Vérifie que le compte Google appartient à l'utilisateur |
| `is_own_google_calendar(google_calendar_id)` | boolean | Vérifie que le calendrier appartient à l'utilisateur |
| `find_group_by_invite_code(code)` | table(id, name) | Trouve un groupe par code d'invitation |
| `join_group_by_invite_code(code, color)` | uuid | Rejoint un groupe de manière atomique |
| `count_group_members(group_id)` | int | Compte les membres d'un groupe |
| `delete_events_for_google_account(account_id)` | void | Supprime tous les événements importés d'un compte |
| `get_member_color(index)` | text | Retourne la couleur à l'index donné (palette de 15) |

### Triggers

- **`update_updated_at()`** : met à jour `updated_at = now()` avant chaque UPDATE sur les tables : profiles, groups, events, google_accounts, google_synced_events

### Buckets de stockage

| Bucket | Accès | Convention de chemin |
|--------|-------|---------------------|
| `avatars` | Public | `avatars/{user_id}/avatar.jpg` |
| `group-avatars` | Public | `group-avatars/{group_id}/avatar.jpg` |

---

## 16. API Routes

### Authentification

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/[locale]/auth/callback` | Échange le code magic link/OAuth contre une session + auto-création profil |

### Google Calendar

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/google/connect` | Génère l'URL OAuth Google |
| GET | `/api/google/callback` | Callback OAuth Google → sauvegarde tokens |
| GET | `/api/google/calendars` | Liste les calendriers Google connectés |
| POST | `/api/google/calendars` | Sauvegarde la sélection de calendriers |
| POST | `/api/google/sync` | Déclenche une synchronisation manuelle |
| GET | `/api/google/sync/events` | Liste les événements synchronisés (filtrable par status) |
| POST | `/api/google/sync/events` | Accepte/refuse un événement synchronisé |
| POST | `/api/google/disconnect` | Déconnecte un compte Google (cascade) |

### Invitations

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/invite/[code]` | Rejoindre un groupe par code d'invitation |

### Bob (Assistant vocal)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/bob/transcribe` | Upload audio → Whisper → texte |
| POST | `/api/bob/parse` | Texte → Claude → JSON événement |
| POST | `/api/bob/create` | Crée l'événement validé |

---

## 17. Pages & Navigation

### Pages publiques

| Route | Description |
|-------|-------------|
| `/login` | Connexion (magic link + Google OAuth) |
| `/invite/[code]` | Rejoindre un groupe via lien d'invitation |

### Pages authentifiées (`/[locale]/(authenticated)/...`)

| Route | Description |
|-------|-------------|
| `/dashboard` | Accueil — liste des groupes + événements à venir |
| `/profile` | Paramètres utilisateur + comptes Google |
| `/groups/new` | Créer un nouveau groupe |
| `/groups/[id]` | Détail du groupe — membres, événements, invitations, admin |
| `/calendar` | Calendrier personnel (tous groupes confondus) |
| `/google-sync` | Page de synchronisation Google (suggestions, accepter/refuser) |
| `/bob` | Assistant vocal pour créer des événements |

### Navigation

- **TopBar** : logo, toggle thème (cœur), sélecteur de langue
- **BottomNav** (4 onglets) : Dashboard, Calendrier, Google Sync, Bob
- Routing par locale : `/fr/...` ou `/en/...`

---

## 18. Sécurité (RLS)

### Politiques par table

#### profiles
- **SELECT** : tous les utilisateurs authentifiés
- **INSERT** : son propre profil uniquement
- **UPDATE** : son propre profil uniquement

#### groups
- **SELECT** : créateurs + membres du groupe
- **INSERT** : tout utilisateur authentifié (avec `created_by = auth.uid()`)
- **UPDATE** : admins du groupe uniquement
- **DELETE** : admins du groupe uniquement

#### group_members
- **SELECT** : co-membres du groupe (via `is_group_member()`)
- **INSERT** : si créateur (`is_group_creator()`) ou invité (`has_pending_invitation()`)
- **UPDATE** : admins (rôle/couleur) + membres (leur propre couleur)
- **DELETE** : admins (tout membre) + membres (eux-mêmes)

#### event_types
- **SELECT** : tous les utilisateurs authentifiés
- **INSERT/UPDATE/DELETE** : ses propres types uniquement (pas les types système)

#### events
- **SELECT** : propriétaire + co-membres des groupes partagés
- **INSERT/UPDATE/DELETE** : propriétaire uniquement

#### invitations
- **SELECT** : membres du groupe
- **INSERT** : admins du groupe
- **UPDATE** : utilisateur invité (accepter)
- **DELETE** : admins du groupe

#### google_accounts / google_calendars / google_synced_events
- **Toutes opérations** : propriétaire du compte uniquement (via fonctions SECURITY DEFINER)

### Patterns critiques

1. **INSERT + SELECT combo** : `.insert().select()` nécessite que la row passe les deux politiques
2. **Récursion inter-tables** : les fonctions SECURITY DEFINER cassent les cycles
3. **Récursion auto-référentielle** : `group_members` utilise `is_group_member()` au lieu d'une sous-requête directe
4. **Joins silencieux** : Supabase retourne `null` (pas d'erreur) si le RLS bloque une table jointe

---

## 19. Tests

### Configuration

- **Framework** : Vitest 4 + Testing Library (React) + jsdom
- **Fichiers** : 24 fichiers de tests dans `src/__tests__/`
- **Total** : 219+ tests passants

### Couverture

| Feature | Tests | Statut |
|---------|-------|--------|
| Auth | Oui | Couvert |
| Profil | Oui | Couvert |
| Groupes | Oui | Couvert |
| Invitations | Oui | Couvert |
| Événements (CRUD) | Oui | Couvert |
| Calendrier | Oui | Couvert |
| Google Sync (M9) | Non | Pas de tests unitaires |
| Photo Upload (M10) | Non | Pas de tests unitaires |
| Bob | Oui | Couvert |

### Commandes

```bash
npx vitest          # Mode watch
npx vitest run      # Exécution unique
```

---

## 20. Déploiement

### Vercel

- **Preview** : déploiements automatiques sur chaque branche
- **Production** : déploiement sur merge dans `main`
- **Framework preset** : Next.js

### Variables d'environnement requises

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (côté serveur) |
| `GOOGLE_CLIENT_ID` | Client ID OAuth Google |
| `GOOGLE_CLIENT_SECRET` | Client Secret OAuth Google |
| `OPENAI_API_KEY` | Clé API OpenAI (Whisper) |
| `ANTHROPIC_API_KEY` | Clé API Anthropic (Claude) |

---

## Historique des milestones

| Milestone | Description | Statut |
|-----------|-------------|--------|
| M1 | Fondations & Auth (magic link + Google OAuth) | ✅ |
| M2 | Pages de groupes enrichies | ✅ |
| M3 | Système d'invitations | ✅ |
| M4 | CRUD événements | ✅ |
| M5–M7 | Calendriers & filtres | ✅ |
| M8 | Polish & PWA | ✅ |
| M9a | Google Calendar — connexion multi-comptes | ✅ |
| M9b | Google Calendar — sélection calendriers + sync | ✅ |
| M9c | Google Calendar — page de suggestions | ✅ |
| M9d | Google Calendar — auto-sync + badge "G" | ✅ |
| M10 | Upload photos (avatar + groupe) | ✅ |
