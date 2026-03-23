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

## M2 — Page groupe enrichie

**Objectif** : La page `/groups/[id]` affiche les membres et permet de gérer le groupe.

- [ ] Afficher la liste des membres du groupe (nom, avatar, rôle, couleur)
- [ ] Badge admin/membre à côté de chaque nom
- [ ] Bouton "Quitter le groupe" (pour les membres non-admin)
- [ ] Si admin quitte : transfert automatique au membre le plus ancien
- [ ] Bouton supprimer le groupe (admin only)
- [ ] Renommer le groupe (admin only, inline edit ou dialog)
- [ ] Clés i18n pour les nouvelles strings (FR + EN)
- [ ] Tests unitaires

**Tables utilisées** : `groups`, `group_members`, `profiles`
**Critère de done** : Un admin peut voir ses membres, renommer, supprimer. Un membre peut quitter.

---

## M3 — Invitations

**Objectif** : Inviter des gens à rejoindre un groupe, accepter une invitation.

- [ ] Bouton "Inviter" sur la page groupe (admin only)
- [ ] Dialog d'invitation avec 2 options :
  - Saisir un email → crée une invitation en DB
  - Copier le lien d'invitation (utilise `invite_code` du groupe)
- [ ] Page `/invite/[code]` : accepter une invitation par lien
  - Si connecté → rejoint le groupe directement
  - Si pas connecté → login puis rejoint
- [ ] Acceptation par email : l'utilisateur reçoit un email, clique, et rejoint
- [ ] Afficher les invitations en attente sur la page groupe (admin)
- [ ] Expiration auto après 7 jours (géré par la DB, afficher le statut)
- [ ] Clés i18n (FR + EN)
- [ ] Tests unitaires

**Tables utilisées** : `invitations`, `group_members`
**Critère de done** : Un admin peut inviter par email ou lien. L'invité peut accepter et apparaît dans le groupe.

---

## M4 — CRUD événements

**Objectif** : Créer, voir, modifier et supprimer des événements.

- [ ] Page/dialog création d'événement depuis la page groupe
- [ ] Formulaire : titre, description, lieu (texte libre), dates début/fin
- [ ] Toggle journée entière vs créneau horaire (start_time/end_time)
- [ ] Sélecteur de type d'événement (Vacances, Disponible, Voyage, Custom)
- [ ] Checkbox "Événement privé" (apparaîtra comme "Occupé" dans le groupe)
- [ ] Liste des événements sur la page groupe (triés par date)
- [ ] Modifier un événement (owner only)
- [ ] Supprimer un événement (owner only, avec confirmation)
- [ ] Section "Prochains événements" sur le dashboard
- [ ] Clés i18n (FR + EN)
- [ ] Tests unitaires

**Tables utilisées** : `events`, `event_types`
**Critère de done** : Un utilisateur peut CRUD ses events. Les events apparaissent dans la liste du groupe et sur le dashboard.

---

## M5 — Calendrier personnel

**Objectif** : Vue calendrier mensuelle pour voir ses propres événements.

- [ ] Installer FullCalendar (`@fullcalendar/core`, `daygrid`, `react`, `interaction`)
- [ ] Composant `PersonalCalendar` avec vue mois
- [ ] Page `/calendar` accessible depuis le BottomNav
- [ ] Afficher mes événements sur le calendrier (barres colorées par type)
- [ ] Clic sur un jour → ouvrir le formulaire de création (date pré-remplie)
- [ ] Clic sur un événement → voir détail / modifier
- [ ] Navigation entre mois (< > + titre mois/année)
- [ ] Clés i18n (FR + EN)
- [ ] Tests unitaires

**Tables utilisées** : `events`, `event_types`
**Critère de done** : L'utilisateur voit ses events dans un calendrier mensuel et peut créer/modifier depuis le calendrier.

---

## M6 — Calendrier de groupe

**Objectif** : Vue calendrier agrégée avec les événements de tous les membres.

- [ ] Composant `GroupCalendar` sur la page `/groups/[id]`
- [ ] Afficher les événements de tous les membres du groupe
- [ ] Couleur par membre (utilise `group_members.color`, 10 couleurs auto)
- [ ] Événements privés → affichés comme "Occupé" (titre masqué, couleur du membre)
- [ ] Légende des couleurs (nom + couleur de chaque membre)
- [ ] Navigation entre mois
- [ ] Clés i18n (FR + EN)
- [ ] Tests unitaires

**Tables utilisées** : `events`, `group_members`, `profiles`
**Critère de done** : Sur la page groupe, on voit le calendrier avec les events de tous les membres, colorés par personne. Les events privés sont masqués.

---

## M7 — Filtres & interactions calendrier

**Objectif** : Affiner la vue calendrier et naviguer dans les événements.

- [ ] Filtres par membre (chips cliquables avec couleur, cocher/décocher)
- [ ] Vue détail d'un événement (dialog ou page) : titre, dates, lieu, type, créateur
- [ ] Distinction visuelle journée entière vs créneau horaire
- [ ] Responsive : calendrier lisible sur mobile 375px
- [ ] Gestion multi-groupes : le BottomNav "Calendrier" montre un sélecteur de groupe
- [ ] Clés i18n (FR + EN)
- [ ] Tests unitaires

**Critère de done** : On peut filtrer par membre, voir le détail d'un event, et le calendrier fonctionne sur mobile.

---

## M8 — Polish & PWA

**Objectif** : Finitions pour une V1 utilisable au quotidien.

- [ ] Service worker basique (cache app shell pour offline)
- [ ] Vérifier install PWA sur iOS Safari + Android Chrome
- [ ] Loading states cohérents (skeletons ou spinners)
- [ ] Empty states avec illustrations/messages utiles
- [ ] Error boundaries sur toutes les pages
- [ ] Vérifier accessibilité : touch targets 48px, contraste 4.5:1, ARIA
- [ ] Test responsive complet (375px → 1440px)
- [ ] Vérifier `npm run build` sans erreurs ni warnings
- [ ] Parcours complet E2E : inscription → créer groupe → inviter → créer event → voir calendrier
- [ ] Audit Lighthouse (perf, a11y, PWA)

**Critère de done** : L'app passe un audit Lighthouse > 90, fonctionne offline basique, et le parcours E2E complet est fluide.

---

## POST-V1 (ne PAS implémenter)

- Événements récurrents
- Statut tentatif/confirmé
- Import/export iCal + synchro Google Calendar
- Détection chevauchements + suggestions créneaux communs
- Notifications push
- Mode offline complet
- Dark mode
