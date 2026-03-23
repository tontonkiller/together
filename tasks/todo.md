# Together — Roadmap par micro-milestones

> Dernière mise à jour : 23 mars 2026
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
- [ ] Tests unitaires

---

## M3 — Invitations ✅ DONE

- [x] Bouton "Inviter" sur la page groupe (admin only)
- [x] Dialog d'invitation avec 2 options
- [x] Page `/invite/[code]` : accepter une invitation par lien
- [ ] Acceptation par email
- [x] Afficher les invitations en attente sur la page groupe (admin)
- [x] Expiration auto après 7 jours
- [x] Clés i18n (FR + EN)
- [ ] Tests unitaires
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
- [ ] Tests unitaires

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

## M9a — Google Calendar: OAuth + Connexion comptes

> Spec complète : `tasks/google-sync-spec.md`

### Database (migration SQL à exécuter manuellement dans Supabase)
- [ ] Table `google_accounts` (id, user_id, google_email, encrypted_refresh_token, access_token, token_expires_at, created_at)
- [ ] Table `google_calendars` (id, google_account_id, google_calendar_id, name, color, is_enabled, created_at)
- [ ] Table `google_synced_events` (id, google_calendar_id, google_event_id, event_id FK→events, status pending/accepted/refused, visibility details/busy, cached fields, google_updated_at, last_synced_at)
- [ ] RLS policies : user peut CRUD ses propres google_accounts/calendars/synced_events
- [ ] Index sur google_synced_events(google_calendar_id, google_event_id) UNIQUE

### Google OAuth flow (scope calendar.readonly)
- [ ] API route `POST /api/google/connect` — génère l'URL OAuth Google avec state=userId, scope=calendar.readonly, access_type=offline, prompt=consent
- [ ] API route `GET /api/google/callback` — échange code → tokens, stocke refresh_token dans google_accounts, redirige vers /profile
- [ ] Env vars : `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (+ doc dans README)

### Token management (lib utilitaire)
- [ ] `src/lib/google/tokens.ts` — getValidAccessToken(googleAccountId) : vérifie expiry, refresh si besoin via Google API, met à jour en DB
- [ ] Utilise le service account Supabase (service_role key) pour lire/écrire les tokens côté serveur

### Profile UI
- [ ] Section "Google Calendar" sur la page profil avec :
  - Bouton "Connecter Google Calendar" → redirige vers /api/google/connect
  - Liste des comptes connectés (email + bouton déconnecter)
  - Déconnexion → supprime google_account + cascade google_calendars + cascade google_synced_events + supprime events liés

### i18n
- [ ] Clés FR + EN pour la section Google Calendar du profil

---

## M9b — Google Calendar: Sélection des calendriers

### API
- [ ] API route `GET /api/google/calendars?accountId=X` — récupère la liste des calendriers Google via API, compare avec google_calendars en DB, retourne les deux
- [ ] API route `POST /api/google/calendars` — sauvegarde la sélection (enabled/disabled) en DB

### UI (page profil ou sous-page)
- [ ] Après connexion d'un compte, afficher la liste des calendriers Google avec toggle on/off
- [ ] Sauvegarder les choix en DB

### i18n
- [ ] Clés FR + EN pour sélection calendriers

---

## M9c — Google Calendar: Sync + Page dédiée

### Sync engine
- [ ] `src/lib/google/sync.ts` — fetchAndSyncEvents(userId) :
  1. Pour chaque google_account du user
  2. Pour chaque google_calendar enabled
  3. Appeler Google Calendar Events API (timeMin=now, timeMax=now+3mois)
  4. Pour chaque événement Google :
     - Si nouveau → insert google_synced_events status=pending
     - Si existant + modifié (google_updated_at changé) → update cached fields + si accepted, update l'event Together lié
     - Si existant en DB mais absent de Google → si accepted, supprimer l'event Together + supprimer la ligne synced_events
  5. Gérer les événements récurrents : expand en occurrences individuelles (singleEvents=true dans l'API call)

### API routes
- [ ] API route `POST /api/google/sync` — déclenche fetchAndSyncEvents pour le user authentifié
- [ ] API route `GET /api/google/sync/events` — retourne les google_synced_events du user (pending + accepted + refused) pour la page
- [ ] API route `POST /api/google/sync/events/accept` — body: { ids: [...], visibility: 'details'|'busy' } → crée les events Together, lie google_synced_events.event_id, status=accepted
- [ ] API route `POST /api/google/sync/events/refuse` — body: { ids: [...] } → status=refused

### Page Google Sync (`/[locale]/google-sync`)
- [ ] Page server component avec layout AuthenticatedLayout
- [ ] Client component `GoogleSyncContent.tsx` :
  - Bouton "Synchroniser" (appelle POST /api/google/sync)
  - Liste de tous les événements avec filtres par statut (pending/accepted/refused)
  - Checkboxes pour sélection multiple
  - Pour chaque événement : titre, date, heure, calendrier source, statut
  - Boutons d'action : "Accepter (détails)", "Accepter (occupé)", "Refuser"
  - Loading state pendant la sync

### Navigation
- [ ] Ajouter "Google Sync" dans la nav (BottomNav + TopBar) — icône Sync ou Google

### i18n
- [ ] Clés FR + EN pour la page Google Sync (~20 clés)

---

## M9d — Google Calendar: Sync automatique + Badge visuel

### Sync à l'ouverture
- [ ] Hook dans le layout principal ou dashboard : si l'user a des google_accounts, déclencher POST /api/google/sync en background à chaque chargement de l'app
- [ ] Debounce : ne pas re-sync si dernière sync < 5 minutes (stocker last_sync_at en localStorage)

### Badge "G" sur les événements importés
- [ ] Ajouter colonne `google_synced_event_id` sur la table `events` (nullable, FK → google_synced_events) — ou simplement vérifier via JOIN
- [ ] Modifier `CalendarContent.tsx` et `GroupCalendar.tsx` : si l'événement a un lien google_synced_events, afficher un petit badge "G"
- [ ] Modifier `EventDetailDialog.tsx` : afficher "Importé depuis Google Calendar" si lié
- [ ] Style du badge : petit chip/icône discret, couleur neutre

### Déconnexion cascade
- [ ] Quand un compte Google est déconnecté : supprimer les events Together liés via google_synced_events.event_id (SECURITY DEFINER function)

### i18n
- [ ] Clés FR + EN pour le badge et l'indicateur Google

### QA finale
- [ ] 3 passes QA + Debug agents
- [ ] Build clean + tests passent
- [ ] Test manuel du flow complet : connect → select calendars → sync → accept/refuse → badge visible → disconnect

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
