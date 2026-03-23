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

## M7 — Filtres & interactions calendrier 🚧 IN PROGRESS

**Objectif** : Affiner la vue calendrier et naviguer dans les événements.

### 7.1 — Filtres par membre sur GroupCalendar
- [ ] Chips cliquables au-dessus du calendrier (un par membre, avec couleur)
- [ ] Toggle on/off pour montrer/cacher les events d'un membre
- [ ] État "tous sélectionnés" par défaut
- [ ] Chip "Tous" pour reset rapide

### 7.2 — Vue détail d'un événement (dialog)
- [ ] Clic sur un event pill (dans GroupCalendar ou CalendarContent) → dialog détail
- [ ] Affiche : titre, dates, lieu, type, créateur (nom + avatar)
- [ ] Si owner → boutons "Modifier" et "Supprimer"
- [ ] Si pas owner → lecture seule
- [ ] Events privés d'autres membres → pas de dialog (ou juste "Occupé")

### 7.3 — Distinction visuelle journée entière vs créneau horaire
- [ ] Journée entière → barre pleine dans la cellule (comme maintenant)
- [ ] Créneau horaire → afficher l'heure (ex: "10:00 Meeting") dans le pill
- [ ] Légende ou indication visuelle du type (bordure pointillée, icône horloge, etc.)

### 7.4 — Responsive mobile 375px
- [ ] Calendar grid lisible sur 375px (font-size réduit, overflow géré)
- [ ] Event pills tronqués proprement sur petit écran
- [ ] Touch targets 48px minimum sur les contrôles
- [ ] Dialogs fullScreen sur mobile (< sm breakpoint)
- [ ] Légende membres : wrap ou scrollable

### 7.5 — Multi-groupes sur le calendrier personnel
- [ ] Fetch tous les groupes de l'utilisateur dans la page calendrier
- [ ] Sélecteur de groupe (dropdown ou chips) au-dessus du calendrier personnel
- [ ] Option "Mes événements" (perso uniquement, défaut)
- [ ] Option par groupe → charge les events du groupe avec couleurs membre
- [ ] Conserver la navigation mois quand on switch de groupe

### 7.6 — i18n & Tests
- [ ] Clés i18n FR + EN pour toutes les nouvelles strings
- [ ] Tests unitaires (filtres, détail event, responsive)

**Critère de done** : On peut filtrer par membre, voir le détail d'un event, et le calendrier fonctionne sur mobile.

---

## M8 — Polish & PWA

- [ ] Service worker basique
- [ ] PWA install iOS + Android
- [ ] Loading states / Empty states
- [ ] Error boundaries
- [ ] Responsive complet
- [ ] Build clean
- [ ] Parcours E2E
- [ ] Audit Lighthouse

---

## POST-V1 (ne PAS implémenter)

- Événements récurrents
- Statut tentatif/confirmé
- Import/export iCal + synchro Google Calendar
- Détection chevauchements + suggestions créneaux communs
- Notifications push
- Mode offline complet
- Dark mode
