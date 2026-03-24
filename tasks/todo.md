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

## M10 — Photo Upload (avatar user + photo groupe)

- [x] Migration SQL: `avatar_url` sur groups + storage buckets + RLS
- [x] Hook `useImageUpload`: resize client + upload Supabase Storage
- [x] Profil: afficher vraie photo + bouton upload
- [x] Groupe: photo de groupe + upload admin only
- [x] Mettre à jour tous les Avatar (dashboard, member list, etc.)
- [x] i18n FR/EN
- [x] Vérification TypeScript

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
