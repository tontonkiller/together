# User Stories & Test Coverage Map

Ce document recense toutes les user stories de l'app Together et mappe chaque critère d'acceptation
vers un test. Un ✅ signifie "test existant", un fichier entre parenthèses indique où le test vit.

---

## US-01 · Inscription / Connexion (M1)

> En tant qu'utilisateur, je veux me connecter via magic link pour accéder à l'app sans mot de passe.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 1.1 | Un email valide est requis pour soumettre le formulaire | ✅ `login/page.test.tsx` |
| 1.2 | Un email invalide affiche une erreur | ✅ `login/page.test.tsx` |
| 1.3 | Supabase `signInWithOtp` est appelé avec le bon email | ✅ `login/page.test.tsx` |
| 1.4 | Un message de succès confirme l'envoi du lien | ✅ `login/page.test.tsx` |
| 1.5 | Le bouton est désactivé pendant le chargement | ✅ `login/page.test.tsx` |
| 1.6 | Un paramètre `?error=auth` affiche une alerte d'erreur | ✅ `login/page.test.tsx` |

## US-02 · Auth Callback (M1)

> En tant qu'utilisateur cliquant sur un magic link, je veux être redirigé vers mon dashboard.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 2.1 | Le code est échangé contre une session | ✅ `auth/callback/route.test.ts` |
| 2.2 | Redirect vers `/dashboard` après échange réussi | ✅ `auth/callback/route.test.ts` |
| 2.3 | Redirect vers `/login?error=auth` si pas de code | ✅ `auth/callback/route.test.ts` |
| 2.4 | Redirect vers `/login?error=auth` si échange échoue | ✅ `auth/callback/route.test.ts` |
| 2.5 | Le profil est auto-créé pour un nouvel utilisateur | ✅ `auth/callback/route.test.ts` |
| 2.6 | Le display_name est extrait du prefix email | ✅ `auth/callback/route.test.ts` |
| 2.7 | Fallback upsert si l'insert échoue | ✅ `auth/callback/route.test.ts` |
| 2.8 | Protection open redirect (pas de `//evil.com`) | ✅ `auth/callback/route.test.ts` |
| 2.9 | Protection open redirect (pas de `https://evil.com`) | ✅ `auth/callback/route.test.ts` |
| 2.10 | Paramètre `next` respecté pour la redirection | ✅ `auth/callback/route.test.ts` |
| 2.11 | Locale invalide → fallback vers `fr` | ✅ `auth/callback/route.test.ts` |
| 2.12 | Locale `en` correctement utilisée | ✅ `auth/callback/route.test.ts` |

## US-03 · Dashboard (M1)

> En tant qu'utilisateur connecté, je veux voir mes groupes et événements à venir.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 3.1 | Message d'accueil avec le nom du profil | ✅ `dashboard/DashboardContent.test.tsx` |
| 3.2 | Fallback "User" si pas de profil | ✅ `dashboard/DashboardContent.test.tsx` |
| 3.3 | Liste des groupes affichée avec nom et description | ✅ `dashboard/DashboardContent.test.tsx` |
| 3.4 | État vide "aucun groupe" avec bouton créer | ✅ `dashboard/DashboardContent.test.tsx` |
| 3.5 | Événements à venir affichés | ✅ `dashboard/DashboardContent.test.tsx` |
| 3.6 | État vide "aucun événement" | ✅ `dashboard/DashboardContent.test.tsx` |
| 3.7 | `formatEventDate` formate correctement same-day all-day | ✅ `dashboard/DashboardContent.test.tsx` |
| 3.8 | `formatEventDate` formate correctement same-day timed | ✅ `dashboard/DashboardContent.test.tsx` |
| 3.9 | `formatEventDate` formate correctement multi-day | ✅ `dashboard/DashboardContent.test.tsx` |

## US-04 · Profil (M1)

> En tant qu'utilisateur, je veux modifier mon nom et ma langue préférée.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 4.1 | Le nom actuel est pré-rempli | ✅ `profile/ProfileContent.test.tsx` |
| 4.2 | Sauvegarder met à jour le profil en base | ✅ `profile/ProfileContent.test.tsx` |
| 4.3 | Message de succès après sauvegarde | ✅ `profile/ProfileContent.test.tsx` |
| 4.4 | Erreur affichée si la sauvegarde échoue | ✅ `profile/ProfileContent.test.tsx` |
| 4.5 | Changer la langue redirige vers la nouvelle locale | ✅ `profile/ProfileContent.test.tsx` |
| 4.6 | Le bouton déconnexion appelle signOut et redirige | ✅ `profile/ProfileContent.test.tsx` |
| 4.7 | L'avatar affiche la première lettre du nom | ✅ `profile/ProfileContent.test.tsx` |
| 4.8 | L'email est en lecture seule | ✅ `profile/ProfileContent.test.tsx` |

## US-05 · Créer un groupe (M2)

> En tant qu'utilisateur, je veux créer un groupe pour rassembler mes proches.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 5.1 | Le nom est obligatoire | ✅ `groups/new/page.test.tsx` |
| 5.2 | La description est optionnelle | ✅ `groups/new/page.test.tsx` |
| 5.3 | Le créateur est ajouté comme admin | ✅ `groups/new/page.test.tsx` |
| 5.4 | Redirect vers la page du groupe après succès | ✅ `groups/new/page.test.tsx` |
| 5.5 | Erreur affichée si la création échoue | ✅ `groups/new/page.test.tsx` |
| 5.6 | Nettoyage du groupe orphelin si l'ajout membre échoue | ✅ `groups/new/page.test.tsx` |
| 5.7 | Bouton désactivé pendant le chargement | ✅ `groups/new/page.test.tsx` |

## US-06 · Page de groupe (M2)

> En tant que membre, je veux voir les détails de mon groupe et gérer les membres.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 6.1 | Redirect login si non authentifié | ✅ `groups/[id]/page.test.ts` |
| 6.2 | Redirect dashboard si non membre | ✅ `groups/[id]/page.test.ts` |
| 6.3 | Redirect dashboard si groupe inexistant | ✅ `groups/[id]/page.test.ts` |
| 6.4 | Transfert admin vers le plus ancien membre | ✅ `GroupDetailContent.test.ts` |
| 6.5 | Tri des événements par date | ✅ `GroupDetailContent.test.ts` |
| 6.6 | Vérification des rôles admin/member | ✅ `GroupDetailContent.test.ts` |
| 6.7 | Détection d'invitations expirées | ✅ `GroupDetailContent.test.ts` |
| 6.8 | Le nom vide est rejeté pour le renommage | ✅ `GroupDetailContent.test.ts` |

## US-07 · Inviter des membres (M3)

> En tant qu'admin, je veux inviter des personnes par email ou par lien.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 7.1 | L'API refuse les non-authentifiés (401) | ✅ `api/invite/route.test.ts` |
| 7.2 | Code invalide → 404 | ✅ `api/invite/route.test.ts` |
| 7.3 | Déjà membre → `alreadyMember: true` | ✅ `api/invite/route.test.ts` |
| 7.4 | Join réussi retourne le groupId | ✅ `api/invite/route.test.ts` |
| 7.5 | RPC échoue → 400 | ✅ `api/invite/route.test.ts` |
| 7.6 | Le bon code est passé au RPC | ✅ `api/invite/route.test.ts` |

## US-08 · Rejoindre par lien (M3)

> En tant qu'invité, je veux cliquer sur un lien et rejoindre automatiquement le groupe.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 8.1 | Auto-join si authentifié | ✅ `invite/[code]/page.test.tsx` |
| 8.2 | Prompt login si non authentifié | ✅ `invite/[code]/page.test.tsx` |
| 8.3 | Message "déjà membre" si applicable | ✅ `invite/[code]/page.test.tsx` |
| 8.4 | Erreur si API échoue | ✅ `invite/[code]/page.test.tsx` |
| 8.5 | Erreur réseau gérée | ✅ `invite/[code]/page.test.tsx` |
| 8.6 | Redirect vers le groupe après join (1.5s) | ✅ `invite/[code]/page.test.tsx` |
| 8.7 | Le code de l'URL est utilisé | ✅ `invite/[code]/page.test.tsx` |

## US-09 · Événements CRUD (M4)

> En tant que membre, je veux créer, voir, modifier et supprimer mes événements.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 9.1 | Le titre est obligatoire | ✅ `EventDialog.test.ts` |
| 9.2 | Les dates sont obligatoires | ✅ `EventDialog.test.ts` |
| 9.3 | La date de fin ≥ date de début | ✅ `EventDialog.test.ts` |
| 9.4 | Les heures sont nullifiées pour les événements all-day | ✅ `EventDialog.test.ts` |
| 9.5 | Les champs optionnels vides sont null | ✅ `EventDialog.test.ts` |
| 9.6 | Les champs optionnels remplis sont préservés | ✅ `EventDialog.test.ts` |
| 9.7 | Formatage same-day all-day ("15 mars — Toute la journée") | ✅ `EventList.test.ts` |
| 9.8 | Formatage same-day timed ("15 mars 09:00 - 17:00") | ✅ `EventList.test.ts` |
| 9.9 | Formatage multi-day ("15 mars → 20 mars") | ✅ `EventList.test.ts` |
| 9.10 | Les heures sont tronquées à HH:MM | ✅ `EventList.test.ts` |

## US-10 · Navigation (M1, mis à jour M9c)

> En tant qu'utilisateur, je veux naviguer facilement entre les pages.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 10.1 | TopBar affiche "Together" | ✅ `TopBar.test.tsx` |
| 10.2 | Click logo → dashboard | ✅ `TopBar.test.tsx` |
| 10.3 | Toggle langue FR ↔ EN | ✅ `TopBar.test.tsx` |
| 10.4 | Toggle Eva mode (icône coeur) | ❌ Non testé |
| 10.5 | BottomNav: Groups tab (dashboard + /groups) | ✅ `BottomNav.test.tsx` |
| 10.6 | BottomNav: Calendar tab | ✅ `BottomNav.test.tsx` |
| 10.7 | BottomNav: Google Sync tab | ✅ `BottomNav.test.tsx` |
| 10.8 | BottomNav: Profile tab | ✅ `BottomNav.test.tsx` |
| 10.9 | BottomNav: Tab actif basé sur l'URL | ✅ `BottomNav.test.tsx` |
| 10.10 | BottomNav: Défaut → Groups pour paths inconnus | ✅ `BottomNav.test.tsx` |

## US-11 · Configuration i18n (M1)

> Le système supporte le français et l'anglais avec le français par défaut.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 11.1 | FR et EN sont les locales supportées | ✅ `config.test.ts` |
| 11.2 | FR est la locale par défaut | ✅ `config.test.ts` |
| 11.3 | La locale par défaut est dans la liste | ✅ `config.test.ts` |

## US-12 · Couleurs membres (M2)

> Chaque membre reçoit une couleur unique dans le groupe.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 12.1 | 15 couleurs disponibles | ✅ `colors.test.ts` |
| 12.2 | Couleurs toutes uniques | ✅ `colors.test.ts` |
| 12.3 | Wrap autour pour index > 15 | ✅ `colors.test.ts` |
| 12.4 | Toutes les couleurs sont des hex valides | ✅ `colors.test.ts` |
| 12.5 | Contraste texte WCAG AA (getContrastTextColor) | ✅ `colors.test.ts` |

## US-13 · Middleware & Routing (M1)

> Le middleware gère le routing i18n et exclut les assets statiques.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 13.1 | La racine `/` est matchée | ✅ `proxy.test.ts` |
| 13.2 | Les paths localisés sont matchés | ✅ `proxy.test.ts` |
| 13.3 | Les paths `/invite/*` sont matchés | ✅ `proxy.test.ts` |
| 13.4 | Les routes `/api/*` ne sont PAS matchées | ✅ `proxy.test.ts` |
| 13.5 | Les assets statiques sont exclus | ✅ `proxy.test.ts` |

## US-14 · Calendrier personnel (M5)

> En tant qu'utilisateur, je veux voir tous mes événements de tous mes groupes sur un calendrier mensuel.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 14.1 | Affiche le mois et l'année courants | ✅ `CalendarContent.test.tsx` |
| 14.2 | Noms des jours en français par défaut | ✅ `CalendarContent.test.tsx` |
| 14.3 | Noms des jours en anglais selon locale | ✅ `CalendarContent.test.tsx` |
| 14.4 | Navigation mois suivant | ✅ `CalendarContent.test.tsx` |
| 14.5 | Navigation mois précédent | ✅ `CalendarContent.test.tsx` |
| 14.6 | Événements affichés sur le bon jour | ✅ `CalendarContent.test.tsx` |
| 14.7 | Événements multi-jours s'étendent sur plusieurs cases | ✅ `CalendarContent.test.tsx` |
| 14.8 | Texte d'aide "clickToCreate" affiché | ✅ `CalendarContent.test.tsx` |
| 14.9 | Redirect login si non authentifié | ✅ `calendar/page.test.ts` |
| 14.10 | Normalisation event_types (array → objet) | ✅ `calendar/page.test.ts` |
| 14.11 | Fallback tableau vide si erreur event types | ✅ `calendar/page.test.ts` |

## US-15 · Calendrier de groupe (M6)

> En tant que membre d'un groupe, je veux voir les événements du groupe sur un calendrier dédié.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 15.1 | Navigation mois (boutons précédent/suivant) | ✅ `GroupCalendar.test.tsx` |
| 15.2 | Affiche le mois et l'année courants | ✅ `GroupCalendar.test.tsx` |
| 15.3 | Noms des jours en FR et EN | ✅ `GroupCalendar.test.tsx` |
| 15.4 | Événements affichés sur le bon jour | ✅ `GroupCalendar.test.tsx` |
| 15.5 | Événements multi-jours s'étendent sur plusieurs cases | ✅ `GroupCalendar.test.tsx` |
| 15.6 | Événements privés d'autrui affichés "Occupé" | ✅ `GroupCalendar.test.tsx` |
| 15.7 | Événements privés personnels affichés avec titre réel | ✅ `GroupCalendar.test.tsx` |
| 15.8 | Mapping couleur membre → événement | ✅ `GroupCalendar.test.tsx` |
| 15.9 | Fallback couleur pour utilisateur inconnu | ✅ `GroupCalendar.test.tsx` |

## US-16 · Filtres & interactions calendrier (M7)

> En tant qu'utilisateur, je veux filtrer les événements par membre et voir les détails au clic.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 16.1 | Chips filtres par membre affichés | ✅ `GroupCalendar.test.tsx` |
| 16.2 | Toggle off masque les événements du membre | ✅ `GroupCalendar.test.tsx` |
| 16.3 | Chip "Tous" toggle all on/off | ✅ `GroupCalendar.test.tsx` |
| 16.4 | Préfixe horaire pour événements avec créneau | ✅ `GroupCalendar.test.tsx` |
| 16.5 | Pas de préfixe pour événements journée entière | ✅ `GroupCalendar.test.tsx` |
| 16.6 | Mapping couleurs types d'événements | ✅ `CalendarContent.test.tsx` |
| 16.7 | getDaysInMonth retourne le bon nombre de jours | ✅ `CalendarContent.test.tsx` |
| 16.8 | isEventOnDay fonctionne pour événements single et multi-day | ✅ `CalendarContent.test.tsx` |

## US-17 · PWA & Polish (M8)

> En tant qu'utilisateur, je veux une app installable avec des états de chargement et gestion d'erreurs.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 17.1 | Service worker enregistré au montage | ✅ `ServiceWorkerRegistration.test.tsx` |
| 17.2 | Composant SW ne rend rien visuellement | ✅ `ServiceWorkerRegistration.test.tsx` |
| 17.3 | Error boundary affiche message et bouton retry | ✅ `RouteErrorBoundary.test.tsx` |
| 17.4 | Error boundary reset fonctionne au clic | ✅ `RouteErrorBoundary.test.tsx` |
| 17.5 | Error boundary log erreur en console | ✅ `RouteErrorBoundary.test.tsx` |
| 17.6 | Page 404 affiche heading et message traduit | ✅ `not-found.test.tsx` |
| 17.7 | Page 404 lien retour dashboard | ✅ `not-found.test.tsx` |
| 17.8 | Skeleton dashboard (placeholders) | ✅ `dashboard/loading.test.tsx` |
| 17.9 | Skeleton calendrier (placeholders) | ✅ `calendar/loading.test.tsx` |

## US-18 · Synchronisation Google Calendar (M9a–M9d)

> En tant qu'utilisateur, je veux connecter mon Google Calendar et voir mes événements Google dans Together.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 18.1 | OAuth flow : connexion compte Google | ❌ Aucun test |
| 18.2 | Gestion tokens : refresh + access token | ❌ Aucun test |
| 18.3 | Sélection calendriers à synchroniser | ❌ Aucun test |
| 18.4 | Moteur de sync : fetch et import événements | ❌ Aucun test |
| 18.5 | Page Google Sync : filtres, checkboxes, actions bulk | ❌ Aucun test |
| 18.6 | AutoSync au lancement app (debounce 5min) | ❌ Aucun test |
| 18.7 | Badge "G" sur événements importés | ❌ Aucun test |
| 18.8 | Déconnexion compte Google (cascade) | ❌ Aucun test |
| 18.9 | Tab Google Sync dans BottomNav | ✅ `BottomNav.test.tsx` |
| 18.10 | Sync result i18n (syncResult key) | ❌ Aucun test |

## US-19 · Upload Photo (M10)

> En tant qu'utilisateur, je veux uploader une photo de profil ou de groupe.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 19.1 | Hook useImageUpload : resize + upload | ❌ Aucun test |
| 19.2 | Profil : afficher photo + bouton upload | ❌ Aucun test |
| 19.3 | Groupe : photo de groupe (admin only) | ❌ Aucun test |
| 19.4 | Avatar mis à jour partout (dashboard, member list) | ❌ Aucun test |
| 19.5 | Migration SQL : avatar_url + storage buckets | ❌ Aucun test |
