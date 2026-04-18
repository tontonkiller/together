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

## M11 — Plans & Sondages de disponibilité ⏳ EN COURS

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

### M11a — Schéma SQL + RLS + migration ⏳

Fichier : `supabase/migrations/010_plans_and_votes.sql`

- [ ] Table `plans` (id, group_id, created_by, title, description, duration enum text check, quorum int check > 0, status text check, resolved_slot_id nullable, event_id nullable, expires_at, created_at, updated_at)
- [ ] Table `plan_slots` (id, plan_id, date, time nullable, position int, created_at)
- [ ] Table `plan_votes` (id, slot_id, user_id, available bool, created_at, UNIQUE(slot_id, user_id))
- [ ] Table `event_participants` (id, event_id, user_id, created_at, UNIQUE(event_id, user_id))
- [ ] Index : `plans(group_id, status)`, `plan_slots(plan_id, position)`, `plan_votes(slot_id)`, `plan_votes(user_id)`
- [ ] Fonction SECURITY DEFINER `is_own_plan(plan_id uuid)` → bool (membre du groupe du plan)
- [ ] Fonction SECURITY DEFINER `resolve_plan_with_slot(plan_id uuid, slot_id uuid)` → event_id
  - Vérifie `auth.uid()` est créateur OU quorum atteint pour slot
  - Crée event (start_date = slot.date, end_date = slot.date, start_time/end_time dérivés de slot.time + duration)
  - Insère `event_participants` pour tous les users ayant voté `available=true` sur ce slot
  - UPDATE plans SET status='resolved', resolved_slot_id, event_id
  - Retourne event_id
- [ ] Fonction SECURITY DEFINER `expire_plan(plan_id uuid)` → status text
  - Si `expires_at > now()` → noop
  - Compte votes par slot, applique règles (0 votes / max unique / égalité)
  - Appelle `resolve_plan_with_slot` ou set `status='pending_tiebreak'` / `'expired'`
- [ ] RLS `plans` :
  - SELECT : `is_group_member(group_id, auth.uid())`
  - INSERT : `created_by = auth.uid() AND is_group_member(group_id, auth.uid())`
  - UPDATE : `created_by = auth.uid()` (pour resolve manuel + tiebreak)
  - DELETE : `created_by = auth.uid() AND status = 'open'`
- [ ] RLS `plan_slots` : SELECT via `is_own_plan`, INSERT = créateur du plan uniquement
- [ ] RLS `plan_votes` :
  - SELECT : `is_own_plan(...)` via sous-requête sur slot
  - INSERT/UPDATE : `user_id = auth.uid() AND is_own_plan(...)`
  - DELETE : `user_id = auth.uid()`
- [ ] RLS `event_participants` :
  - SELECT : `is_group_member(group_id_de_l_event, auth.uid())` via helper
  - INSERT/DELETE : owner de l'event (`events.user_id = auth.uid()`)
- [ ] Trigger `plans_updated_at`
- [ ] Test manuel RLS dans Supabase SQL editor (pattern `set role authenticated; set request.jwt.claims...`)

### M11b — API Routes ⏳

- [ ] `src/lib/types/plans.ts` : interfaces `Plan`, `PlanSlot`, `PlanVote`, `PlanWithSlots`, `PlanSlotWithVotes`
- [ ] `src/lib/plans/validation.ts` : fonctions pures `validatePlanInput`, `validateSlotInput`, `validateVoteInput`
- [ ] `src/lib/plans/resolveHelpers.ts` : logique tiebreak (`findWinningSlot(slots)` → `{ slotId | tied }`)
- [ ] `GET /api/groups/[id]/plans/route.ts` : liste + lazy expiration check (appelle `expire_plan` pour les plans expirés avant return)
- [ ] `POST /api/groups/[id]/plans/route.ts` : création plan + slots (transaction via RPC `create_plan_with_slots`)
- [ ] `GET /api/plans/[id]/route.ts` : détail plan avec slots + votes agrégés
- [ ] `DELETE /api/plans/[id]/route.ts` : suppression (RLS gère la permission)
- [ ] `POST /api/plans/[id]/vote/route.ts` : upsert votes (body: `[{ slot_id, available }]`), puis check quorum → auto-resolve si atteint
- [ ] `POST /api/plans/[id]/resolve/route.ts` : resolve manuel (body: `{ slot_id }`), créateur only (RLS)
- [ ] Tests unitaires : 1 fichier par route (mock Supabase, pattern `api/invite/[code]/route.test.ts`)
- [ ] Tests validation : `src/lib/plans/validation.test.ts`, `src/lib/plans/resolveHelpers.test.ts`

### M11c — UI page groupe ⏳

Dossier : `src/app/[locale]/(authenticated)/groups/[id]/`

- [ ] `PlanDialog.tsx` : création d'un plan (titre, desc, duration select, quorum input, slots dynamiques)
  - Ajout/suppression de slots, toggle « ajouter heure » par slot
  - Validation min 2 slots, quorum ≤ nb membres
  - fullScreen sur mobile (pattern `EventDialog`)
- [ ] `PlanList.tsx` : carte par plan
  - Header : titre, créateur, durée, deadline (ex: « Expire dans 2j »)
  - Slots avec barre de progression WhatsApp-style + avatars des votants
  - Status chip (`open`, `resolved`, `expired`, `pending_tiebreak`)
  - Bouton « Valider ce créneau » visible créateur only
  - Bouton delete créateur only
- [ ] `PlanVoteButtons.tsx` : toggle Disponible/Pas dispo par slot (upsert via API)
- [ ] `PlanResolveConfirm.tsx` : confirm dialog pour resolve manuel + tiebreak
- [ ] Intégration dans `GroupDetailContent.tsx` :
  - Section « Plans » avant la liste des événements
  - Visible si ≥ 1 plan (tous statuts, `expired` collapsible)
  - Bouton « Créer un plan »
- [ ] Clés i18n `plans` dans `fr.json` + `en.json` (toutes les clés du spec §10)
- [ ] Tests unitaires : validation UI pure (`PlanDialog.test.ts`), tiebreak helpers

### M11d — Badge dashboard + notifications ⏳

- [ ] Fonction helper `src/lib/plans/queries.ts` : `countPendingVotesForUser(groupIds, userId)` → map group_id → count
  - Compte les plans `open` où le user n'a voté sur aucun slot
- [ ] Intégration dashboard : `DashboardContent.tsx` fetch les counts + affiche badge MUI sur chaque card groupe
- [ ] Intégration page groupe : badge sur le bouton « Plans » si tiebreak en attente pour le créateur
- [ ] Auto-refresh : revalidate le GET plans toutes les N secondes OU au mount (pas de websocket pour V1)
- [ ] Clé i18n `plans.badge` (déjà dans §10)
- [ ] Tests : `queries.test.ts` (calcul du badge)

### QA milestone (mandatoire avant done)
- [ ] 3 passes QA + Debug successives (parallèles), fix tout
- [ ] Build clean, 0 lint, 0 TS error
- [ ] Tests : tous passent
- [ ] Manuel : créer plan → vote → auto-resolve via quorum → event créé avec bons participants
- [ ] Manuel : plan expiré 0 votes → expired ; 1 gagnant → event ; égalité → pending_tiebreak ; créateur résout
- [ ] Lessons capturées dans `tasks/lessons.md` si corrections

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
