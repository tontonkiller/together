# Together — Roadmap par micro-milestones

> Dernière mise à jour : 25 mars 2026
> Chaque milestone = 1-2 jours, testable, livrable indépendamment.

---

## M1 — Fondations & Auth ✅ DONE

- [x] Init Next.js 16 + TypeScript + MUI v7 + Supabase
- [x] Config PWA (manifest.ts, icônes 192/512)
- [x] Schema Supabase complet (6 tables + RLS + triggers + fonctions SECURITY DEFINER)
- [x] Landing page
- [x] Auth magic link (login, callback, auto-create profile)
- [x] Page profil (nom, avatar initiale, langue FR/EN)
- [x] Layout global (TopBar + BottomNav)
- [x] i18n FR/EN (next-intl, 62 clés)
- [x] Middleware (Supabase session refresh + i18n routing)
- [x] Dashboard avec liste des groupes
- [x] Page création de groupe (`/groups/new`) avec ajout auto admin
- [x] Page groupe stub (`/groups/[id]`)
- [x] RLS fixes (récursion, INSERT+SELECT combo)
- [x] Unit tests (auth callback, normalize, i18n config)
- [x] CI/CD pipeline + pre-push hooks

---

## M2 — Page groupe enrichie ✅ DONE

- [x] Afficher la liste des membres du groupe (nom, avatar, rôle, couleur)
- [x] Badge admin/membre à côté de chaque nom
- [x] Bouton "Quitter le groupe" (pour les membres non-admin)
- [x] Si admin quitte : transfert automatique au membre le plus ancien
- [x] Bouton supprimer le groupe (admin only)
- [x] Renommer le groupe (admin only, inline edit ou dialog)
- [x] Clés i18n pour les nouvelles strings (FR + EN)
- [x] Tests unitaires (GroupDetailContent.test.ts : admin transfer, event sorting, rôles, invitation expirée, renommage vide)

---

## M3 — Invitations ✅ DONE

- [x] Bouton "Inviter" sur la page groupe (admin only)
- [x] Dialog d'invitation avec 2 options
- [x] Page `/invite/[code]` : accepter une invitation par lien
- [ ] Acceptation par email
- [x] Afficher les invitations en attente sur la page groupe (admin)
- [x] Expiration auto après 7 jours
- [x] Clés i18n (FR + EN)
- [x] Tests unitaires (api/invite/route.test.ts + invite/[code]/page.test.tsx)
- [x] SQL functions (SECURITY DEFINER) pour join-by-invite-code

---

## M4 — CRUD événements ✅ DONE

- [x] Page/dialog création d'événement depuis la page groupe
- [x] Formulaire : titre, description, lieu, dates début/fin
- [x] Toggle journée entière vs créneau horaire
- [x] Sélecteur de type d'événement
- [x] Checkbox "Événement privé"
- [x] Liste des événements sur la page groupe
- [x] Modifier un événement (owner only)
- [x] Supprimer un événement (owner only)
- [x] Section "Prochains événements" sur le dashboard
- [x] Clés i18n (FR + EN)
- [x] Tests unitaires (EventDialog.test.ts + EventList.test.ts)

---

## M5 — Calendrier personnel ✅ DONE

- [x] All items completed

---

## M6 — Calendrier de groupe ✅ DONE

- [x] All items completed

---

## M7 — Filtres & interactions calendrier ✅ DONE

- [x] Filtres par membre (chips cliquables avec couleur, toggle on/off, chip "Tous")
- [x] Vue détail d'un événement (EventDetailDialog : titre, dates, lieu, type, créateur, edit/delete owner)
- [x] Distinction visuelle journée entière (barre pleine) vs créneau horaire (time prefix + left border)
- [x] Responsive mobile 375px (smaller cells, fewer pills, fullScreen dialogs)
- [x] Multi-groupes : sélecteur de groupe (chips) sur le calendrier personnel
- [x] Clés i18n FR + EN
- [x] Tests unitaires (206 tests, +4 nouveaux pour filtres et time display)

---

## M8 — Polish & PWA ✅ DONE

- [x] Service worker basique (public/sw.js — cache-first static, network-first nav/API, proper offline fallbacks)
- [x] PWA install iOS + Android (meta tags, apple-touch-icon, manifest)
- [x] Loading states / Empty states (Skeleton loaders per route: dashboard, group, calendar, profile)
- [x] Error boundaries (nested per route + shared RouteErrorBoundary, all i18n-translated)
- [x] 404 not-found page (i18n translated)
- [x] Responsive complet (useMediaQuery, breakpoints, fullScreen dialogs)
- [x] Build clean (0 ESLint errors, 0 warnings, TypeScript clean)
- [x] Tests: 217 passing across 24 test files
- [x] QA: 3 successive QA + Debug passes — all clean

---

## M9a — Google Calendar: OAuth + Connexion comptes ✅ DONE

> Spec complète : `tasks/google-sync-spec.md`

- [x] 3 tables: google_accounts, google_calendars, google_synced_events + RLS + indexes
- [x] OAuth flow: POST /api/google/connect + GET /api/google/callback
- [x] Token management: src/lib/google/tokens.ts + getAccessToken.ts
- [x] Profile UI: connect/disconnect Google accounts
- [x] Disconnect cascade via SECURITY DEFINER function
- [x] i18n FR + EN (~30 keys)

---

## M9b — Google Calendar: Sélection des calendriers ✅ DONE

- [x] GET/POST /api/google/calendars — list and save calendar selections
- [x] GoogleCalendarSelect component — expandable per-account calendar toggles
- [x] Integrated into profile page

---

## M9c — Google Calendar: Sync + Page dédiée ✅ DONE

- [x] Sync engine: src/lib/google/sync.ts (fetchAndSyncEvents)
- [x] POST /api/google/sync — trigger sync
- [x] GET /api/google/sync/events — list synced events
- [x] POST /api/google/sync/events — accept/refuse with visibility choice
- [x] Google Sync page: /[locale]/google-sync with filter chips, checkboxes, bulk actions
- [x] BottomNav: added Google Sync tab (4 tabs)

---

## M9d — Google Calendar: Sync automatique + Badge visuel ✅ DONE

- [x] AutoSync component: triggers sync on app open, debounced 5min via localStorage
- [x] "G" badge on CalendarContent + GroupCalendar event pills
- [x] EventDetailDialog: "Google Calendar" chip for imported events
- [x] googleEventIds passed through page → component chain
- [x] Build clean, 219 tests passing

---

## M10 — Photo Upload (avatar user + photo groupe) ✅ DONE

- [x] Migration SQL: `avatar_url` sur groups + storage buckets + RLS
- [x] Hook `useImageUpload`: resize client + upload Supabase Storage
- [x] Profil: afficher vraie photo + bouton upload
- [x] Groupe: photo de groupe + upload admin only
- [x] Mettre à jour tous les Avatar (dashboard, member list, etc.)
- [x] i18n FR/EN
- [x] Vérification TypeScript
- [ ] Tests unitaires (useImageUpload, avatar upload flow)

---

## M11 — Plans & Sondages de disponibilité ✅ DONE (sauf QA manuelle + cleanup CI)

> Spec complète : `tasks/plans-spec.md`
> Branche : `claude/new-feature-ncU3z`

### Décisions d'architecture (à valider avant M11a)

1. **Participants de l'événement créé** → **Option B : table `event_participants`**
   - `id, event_id FK, user_id FK, created_at, UNIQUE(event_id, user_id)`
   - RLS : membres du groupe de l'event peuvent lire ; insert/delete = owner de l'event
   - Raison : plus simple pour queries « qui vient ? », cohérent avec `plan_votes`, pas d'array pgsql

2. **Validation automatique au quorum** → **côté API après chaque vote**
   - Pas de trigger SQL (évite récursion RLS et complexité)
   - Le route handler `POST /api/plans/[id]/vote` recalcule les votes après upsert et appelle un RPC `resolve_plan_with_slot(plan_id, slot_id)` (SECURITY DEFINER) si quorum atteint
   - RPC : crée l'event + insère les participants + passe `status='resolved'` en une transaction

3. **Expiration des plans** → **lazy check, pas de cron**
   - À chaque GET `/api/groups/[id]/plans`, détecter les plans `open` avec `expires_at < now()`
   - Appeler RPC `expire_plan(plan_id)` qui :
     - 0 votes → `status='expired'`
     - 1+ votes, pas d'égalité → choisit créneau max, crée event, `status='resolved'`
     - 1+ votes, égalité → `status='pending_tiebreak'`
   - Raison : pas d'infra cron à gérer, affichage en temps réel cohérent

4. **Créneaux datetime** → **colonnes séparées `date date NOT NULL` + `time time NULL`**
   - Conforme au spec (§1) — créneau « date seule » vs « date + heure » au choix par slot

5. **Multi-votes** → un vote par (slot, user). Un user peut voter sur plusieurs slots. `plan_votes.available` bool obligatoire (pas de 3e état).

---

### M11a — Schéma SQL + RLS + migration ✅

Fichier : `supabase/migrations/010_plans_and_votes.sql`

- [x] Table `plans` (id, group_id, created_by, title, description, duration text check, quorum int check > 0, status text check, resolved_slot_id nullable, event_id nullable, expires_at default now()+3d, created_at, updated_at)
- [x] Table `plan_slots` (id, plan_id, date, time nullable, position int, created_at)
- [x] Table `plan_votes` (id, slot_id, user_id, available bool, created_at, UNIQUE(slot_id, user_id))
- [x] Table `event_participants` (id, event_id, user_id, created_at, UNIQUE(event_id, user_id))
- [x] Indexes : `plans(group_id, status)`, `plans(created_by)`, `plan_slots(plan_id, position)`, `plan_votes(slot_id)`, `plan_votes(user_id)`, `event_participants(event_id)`, `event_participants(user_id)`
- [x] Fonctions SECURITY DEFINER : `is_own_plan`, `is_own_slot`, `can_view_event`, `is_event_owner`, `compute_event_times`
- [x] RPC `create_plan_with_slots(group_id, title, description, duration, quorum, slots jsonb)` → plan_id
  - Vérifie membership + quorum ≤ member_count + min 2 slots
- [x] RPC `_create_event_from_slot(plan_id, slot_id)` → event_id (interne, sans check permission)
- [x] RPC `resolve_plan_with_slot(plan_id, slot_id)` → event_id
  - Permission : créateur OU quorum atteint
  - Crée event + participants + update plan status='resolved'
- [x] RPC `expire_plan(plan_id)` → status text
  - Noop si `expires_at > now()` ou `status != 'open'`
  - 0 votes → expired ; 1 gagnant → resolved + event ; égalité → pending_tiebreak
- [x] RLS `plans` : SELECT membre, INSERT créateur+membre, UPDATE créateur, DELETE créateur+open
- [x] RLS `plan_slots` : SELECT via `is_own_plan`, INSERT/DELETE créateur du plan + status open
- [x] RLS `plan_votes` : SELECT via `is_own_slot`, INSERT `user_id=auth.uid()+is_own_slot`, UPDATE/DELETE `user_id=auth.uid()`
- [x] RLS `event_participants` : SELECT `can_view_event`, INSERT/DELETE `is_event_owner`
- [x] Trigger `plans_updated_at`
- [x] Script de tests RLS : `supabase/tests/010_plans_rls.sql` (12 tests, à exécuter manuellement dans Supabase SQL Editor)

### M11b — API Routes ✅

- [x] `src/lib/types/plans.ts` : interfaces `Plan`, `PlanSlot`, `PlanVote`, `PlanWithSlots`, `PlanSlotWithVotes`, `PlanInput`, `VoteInput`
- [x] `src/lib/plans/validation.ts` : `validatePlanInput`, `validateSlotInput`, `validateVoteInput`, `validateResolveInput`, `extractPlanInput`, `extractVotes`
- [x] `src/lib/plans/resolveHelpers.ts` : `countYesVotes`, `findWinningSlot`, `hasQuorumOnSlot`, `findQuorumSlot`, `hasUserVoted`, `hasUserVotedOnAnySlot`, `daysUntilExpiry`, `isExpired`
- [x] `GET /api/groups/[id]/plans/route.ts` : liste + lazy expiration (appelle `expire_plan` puis re-fetch)
- [x] `POST /api/groups/[id]/plans/route.ts` : création via RPC `create_plan_with_slots` (validation front + back)
- [x] `GET /api/plans/[id]/route.ts` : détail plan + lazy expiration
- [x] `DELETE /api/plans/[id]/route.ts` : suppression via RLS + `count: 'exact'` pour détecter 403
- [x] `POST /api/plans/[id]/vote/route.ts` : upsert votes + détection quorum + auto-resolve via RPC
- [x] `POST /api/plans/[id]/resolve/route.ts` : resolve manuel via RPC (créateur only géré en SQL)
- [x] Tests validation : `validation.test.ts` (18 tests), `resolveHelpers.test.ts` (14 tests)

### M11c — UI page groupe ✅

Dossier : `src/app/[locale]/(authenticated)/groups/[id]/`

- [x] `PlanDialog.tsx` : formulaire création (titre, desc, duration, quorum, slots dynamiques)
  - Toggle « avec heure » par slot
  - Validation côté client + mapping erreur → i18n
  - fullScreen mobile
- [x] `PlanList.tsx` : card par plan avec slots + barres de progression
  - Avatars des votants (AvatarGroup, couleur membre)
  - ToggleButtonGroup pour voter (Disponible/Pas dispo)
  - Status chip colorisé
  - Bannière `pending_tiebreak` pour le créateur
  - Bouton « Valider ce créneau » créateur only
  - Bouton delete inline avec confirm
- [x] `PlanResolveConfirm.tsx` : dialog de confirmation avec date formatée
- [x] Intégration `page.tsx` (server fetch + lazy expiration) → `GroupDetailContent.tsx`
- [x] Clés i18n `plans` FR + EN (~70 clés)
- [x] Tests : validation + resolveHelpers (déjà en M11b)

### M11d — Badge dashboard ✅

- [x] `src/lib/plans/queries.ts` : `computePlanBadges(plans, userId)` → `{ pendingByGroup }`
  - Compte plans `open` sans vote + `pending_tiebreak` si créateur
- [x] `dashboard/page.tsx` : fetch plans pour tous les groupes du user + computes badges côté serveur
- [x] `DashboardContent.tsx` : badge MUI + chip rouge sur chaque card groupe
- [x] Tests : `queries.test.ts` (4 tests)

### Plan de test M11

**Couche 1 — SQL / RLS (M11a)**
- [ ] `supabase/tests/010_plans_rls.sql` : script de tests manuels à exécuter dans Supabase SQL Editor
  - Setup : créer 2 users, 1 groupe, 1 non-membre
  - Test SELECT : membre voit les plans du groupe, non-membre non
  - Test INSERT plan : membre OK, non-membre bloqué, `created_by != auth.uid()` bloqué
  - Test INSERT slot : créateur du plan OK, autre membre bloqué
  - Test INSERT vote : membre vote pour soi OK, vote pour autre user bloqué, `available` NULL bloqué
  - Test DELETE plan : créateur + `status='open'` OK, `status='resolved'` bloqué, autre user bloqué
  - Test RPC `resolve_plan_with_slot` : quorum non atteint + pas créateur → bloqué ; créateur → OK ; quorum atteint → OK
  - Test RPC `expire_plan` : 0 votes → expired ; 1 winner → resolved + event créé ; tie → pending_tiebreak
  - Test `event_participants` auto-créé pour tous les `available=true` du slot gagnant

**Couche 2 — Unit tests purs (M11b, M11c)**
- [ ] `src/lib/plans/validation.test.ts` :
  - `validatePlanInput` : titre vide, quorum ≤ 0, quorum > members, < 2 slots, duration invalide, OK
  - `validateSlotInput` : date passée, date + time incohérent, OK
  - `validateVoteInput` : slot_id manquant, available non-bool, OK
- [ ] `src/lib/plans/resolveHelpers.test.ts` :
  - `findWinningSlot` : 0 votes → null, 1 winner → id, tie → { tied: [id1, id2] }
  - `computeEventTimes` : half_day/full_day → all_day ; 30min/1h/2h/3h + time → calcul end_time
- [ ] `src/lib/plans/queries.test.ts` (M11d) :
  - `countPendingVotesForUser` : user sans vote → count++ ; user ayant voté → ignore ; plan expired → ignore

**Couche 3 — API route tests (M11b)**
- [ ] `src/app/api/groups/[id]/plans/route.test.ts` :
  - 401 non-authentifié, 403 non-membre, 400 invalid body, 201 création OK
  - GET : filtrage par group_id, lazy expiration déclenchée pour plans expirés
- [ ] `src/app/api/plans/[id]/route.test.ts` : GET/DELETE, permissions
- [ ] `src/app/api/plans/[id]/vote/route.test.ts` :
  - 401, 403 non-membre, vote OK, update vote existant
  - Auto-resolve déclenché si quorum atteint (mock RPC)
- [ ] `src/app/api/plans/[id]/resolve/route.test.ts` : créateur OK, non-créateur bloqué, plan déjà resolved bloqué

**Couche 4 — Component tests (M11c)**
- [ ] `PlanDialog.test.ts` : logique pure extraite (validation du form), comme `EventDialog.test.ts`
- [ ] `PlanList.test.ts` : rendu des status chips, affichage deadline, visibilité des boutons selon user/status

**Couche 5 — Manuel (QA milestone)**
- [ ] Créer plan → vote d'un autre membre → vérifier barres de progression temps réel
- [ ] Atteindre quorum via votes → vérifier event auto-créé + participants corrects
- [ ] Valider manuellement un créneau (créateur) avant deadline → event créé
- [ ] Attendre (ou forcer via update SQL) deadline sur plan avec 0 votes → status expired
- [ ] Forcer deadline avec 1 winner clair → status resolved + event
- [ ] Forcer deadline avec égalité → status pending_tiebreak + notification créateur → créateur choisit
- [ ] Supprimer plan (créateur, status open) → OK ; (autre user ou status≠open) → bouton invisible
- [ ] Multi-plans ouverts sur un groupe → tous affichés, badge dashboard correct
- [ ] Tests responsive mobile 375px sur PlanDialog + PlanList

### CI — Setup GitHub Actions (M11a, pré-requis)

> Constat : aucun workflow `.github/workflows/` n'existe actuellement. L'item M1 « CI/CD pipeline » a été coché mais les fichiers ne sont pas dans le repo (probablement couvert par Vercel preview deployments côté plateforme).

**Proposition** : créer `.github/workflows/ci.yml` déclenché sur PR + push sur `main` :
- [ ] Job `lint` : `npm ci` + `npm run lint`
- [ ] Job `typecheck` : `npx tsc --noEmit`
- [ ] Job `test` : `npm test` (vitest run)
- [ ] Job `build` : `npm run build` (avec env vars dummy pour Supabase)
- [ ] Matrix Node 20 LTS uniquement (Next.js 16 requirement)
- [ ] Cache npm dependencies

**Décision à valider** : est-ce qu'on ajoute ce workflow CI dans M11a (pour cadrer le feature dès le départ), ou on le garde pour plus tard ? Sans CI, impossible de bloquer les PRs cassées.

### QA milestone (mandatoire avant done)
- [ ] 3 passes QA + Debug successives (parallèles), fix tout
- [ ] Build clean : `npm run build` → 0 erreur, 0 warning
- [ ] Lint clean : `npm run lint` → 0 erreur
- [ ] TypeScript clean : `npx tsc --noEmit` → 0 erreur
- [ ] Tests : `npm test` → tous les tests passent (cible : couvrir toutes les couches 1-5 ci-dessus)
- [ ] Manuel complet : checklist « Couche 5 » ci-dessus
- [ ] Lessons capturées dans `tasks/lessons.md` si corrections

---

## M12 — Google OAuth signup unifié avec Calendar scope ⏳ EN COURS

> Spec : demander Google auth + Calendar scope en un seul consent screen au signup.
> Branche : `claude/new-feature-ncU3z` (sync avec main après merge M11)

### Contexte & constat

- Actuellement : Google sign-in via `supabase.auth.signInWithOAuth({ provider: 'google' })` demande uniquement les scopes basiques (email, profile). Pour connecter Calendar les users doivent faire un 2e flow séparé via M9a (`/api/google/connect`).
- La majorité des users signe avec Google — ergonomie à améliorer.
- M9a a déjà : table `google_accounts`, `getAccessToken.ts` (refresh), `sync.ts`, helpers Calendar API. Tout réutilisable.

### Recherche préalable (validée via doc Supabase + issues GitHub)

1. Supabase **renvoie bien** `provider_refresh_token` avec `access_type=offline` + `prompt=consent` (doc officielle `auth-google`).
2. Disponible **uniquement** dans le callback SSR juste après `exchangeCodeForSession` — **fenêtre unique**, disparaît ensuite.
3. Supabase **ne refresh jamais** le Google token — on réutilise `getAccessToken` M9a.
4. Avec `prompt=consent`, nouveau `refresh_token` à chaque login → upsert (pas insert).
5. **Granular consent** : users peuvent décocher Calendar → session créée quand même, scopes à vérifier via `oauth2/v3/tokeninfo`.
6. Gotcha : scope `/auth/calendar` est "sensitive" → vérif Google OAuth requise (~4-6 semaines). **Statut actuel de la Cloud Console à vérifier** (probablement déjà OK via M9a).

### Décisions d'architecture (validées)

| # | Décision | Rationale |
|---|----------|-----------|
| 1 | **Additif, pas remplacement** | Magic link reste en fallback. Google sign-in upgrade seulement. |
| 2 | **Supabase provider avec scopes custom** | Utilise l'API Supabase native, pas besoin de reimplémenter OAuth. |
| 3 | **Réutilise `google_accounts` de M9a** | Zéro nouvelle table. Ajoute juste `calendar_granted bool` pour tracker le cas granular-consent. |
| 4 | **Scope R+W** : `https://www.googleapis.com/auth/calendar` | Spec default. M9a utilise déjà ce scope. |
| 5 | **Capture stricte dans `/auth/callback`** | Seul endroit possible. |
| 6 | **Fallback `/api/google/connect` (M9a) conservé** | Pour users magic-link + pour re-consent granular. |
| 7 | **Migration users existants** : aucune — `prompt=consent` force le nouveau consent au prochain login | Pas de data migration, auto-onboarding. |

### M12a — Migration SQL ⏳

Fichier : `supabase/migrations/012_google_calendar_granted.sql`

- [ ] Ajouter colonne `calendar_granted boolean not null default true` à `google_accounts`
  - Note : `default true` pour compatibilité avec les rows M9a existantes (elles ont toutes Calendar, c'était le seul scope demandé)
- [ ] Idempotent via `alter table ... add column if not exists`
- [ ] Test local sur Postgres 16

### M12b — Login + callback ⏳

- [ ] **`src/app/[locale]/login/page.tsx`** : ajouter `scopes` + `queryParams` au `signInWithOAuth` :
  ```ts
  options: {
    scopes: 'openid email profile https://www.googleapis.com/auth/calendar',
    queryParams: { access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true' },
    redirectTo: getCallbackUrl(),
  }
  ```
- [ ] **`src/app/[locale]/auth/callback/route.ts`** : après `exchangeCodeForSession(code)` :
  - Récupérer `data.session.provider_token` + `data.session.provider_refresh_token` + `user.email`
  - Si `provider_refresh_token` absent (= magic link, pas Google) → skip
  - Sinon : appeler `oauth2/v3/tokeninfo?access_token={provider_token}` → lire `scope` string → vérifier si contient `https://www.googleapis.com/auth/calendar` → calendar_granted bool
  - Upsert dans `google_accounts` : `{ user_id, google_email, refresh_token, access_token, token_expires_at, calendar_granted }` avec `onConflict: 'user_id,google_email'`
  - Si erreur tokeninfo ou upsert : **ne pas bloquer le login**, juste log et redirect comme avant
- [ ] **`src/lib/google/tokens.ts`** : vérifier que le refresh logic gère bien la rotation (si Google renvoie nouveau refresh_token, le persister)

### M12c — UI banner re-consent granular ⏳

- [ ] **`src/app/[locale]/(authenticated)/dashboard/DashboardContent.tsx`** :
  - Fetch côté serveur : `google_accounts.calendar_granted` pour l'user connecté
  - Si `false` ET user a un Google account connecté : banner non-bloquant
  - Banner : "Reconnecte ton Calendar pour synchroniser tes events" + bouton qui déclenche `/api/google/connect` (flow M9a existant)
- [ ] i18n : clés `calendar.reconnectBanner.*` en FR + EN

### M12d — Tests ⏳

**Unit tests**
- [ ] `src/lib/google/tokens.test.ts` : rotation du refresh_token lors du refresh call
- [ ] `src/app/[locale]/auth/callback/route.test.ts` : cas Google avec Calendar OK, Google avec Calendar unchecked, magic link (skip google_accounts)

**Manuel (QA)**
- [ ] Nouveau user Google avec Calendar coché → compte créé + `google_accounts` rempli + `calendar_granted=true` + sync fonctionne
- [ ] Nouveau user Google avec Calendar décoché → compte créé + `calendar_granted=false` + banner affiché → clic sur banner → M9a flow → banner disparaît
- [ ] User existant se re-login Google → nouveau refresh_token upsert (pas de duplication)
- [ ] User révoque accès depuis Google settings → next refresh call retourne `invalid_grant` → vérifier que le code M9a gère (logger / flag)
- [ ] User magic link signs in → aucune row `google_accounts` créée (skip correct)
- [ ] Vérification Cloud Console : scope `calendar` approuvé en Production

### Risques identifiés

1. **Vérification OAuth Google** : si pas encore approuvée, les nouveaux users verront "unverified app warning". Impact UX. À vérifier en amont.
2. **Migration users existants** : ils ne seront pas synchros calendar tant qu'ils n'auront pas re-login. Pas de data migration possible côté DB — c'est inhérent à OAuth.
3. **Fenêtre unique du provider_refresh_token** : si le callback plante avant persist → user pas bloqué (auth créée) mais calendar pas connecté → banner apparaît → ils re-consent via M9a. Ce fallback ABSORBE le risque.
4. **Rotation refresh_token** : Google **peut** renvoyer un nouveau refresh_token lors d'un refresh call. Si on l'ignore et qu'il révoque l'ancien, on perd l'accès. Le code M9a doit le gérer (à vérifier).

### CI & lint

- [ ] `npm test` + `npx tsc --noEmit` + `npm run lint` + `npm run build` tous verts avant commit
- [ ] Tests locaux sur Postgres 16 pour la migration SQL

---

## POST-V1 (ne PAS implémenter)

- Sync bidirectionnelle (Together → Google)
- Export iCal
- Import depuis Apple Calendar / Outlook
- Notifications de rappel sur événements importés
- Détection chevauchements + suggestions créneaux communs
- Notifications push
- Mode offline complet
- Dark mode
