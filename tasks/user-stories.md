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

## US-10 · Navigation (M1)

> En tant qu'utilisateur, je veux naviguer facilement entre les pages.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 10.1 | TopBar affiche "Together" | ✅ `TopBar.test.tsx` |
| 10.2 | Click logo → dashboard | ✅ `TopBar.test.tsx` |
| 10.3 | Toggle langue FR ↔ EN | ✅ `TopBar.test.tsx` |
| 10.4 | BottomNav: Dashboard tab | ✅ `BottomNav.test.tsx` |
| 10.5 | BottomNav: Profile tab | ✅ `BottomNav.test.tsx` |
| 10.6 | BottomNav: Tab actif basé sur l'URL | ✅ `BottomNav.test.tsx` |

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
| 12.1 | 10 couleurs disponibles | ✅ `colors.test.ts` |
| 12.2 | Couleurs toutes uniques | ✅ `colors.test.ts` |
| 12.3 | Wrap autour pour index > 10 | ✅ `colors.test.ts` |
| 12.4 | Toutes les couleurs sont des hex valides | ✅ `colors.test.ts` |

## US-13 · Middleware & Routing (M1)

> Le middleware gère le routing i18n et exclut les assets statiques.

| # | Critère d'acceptation | Fichier de test |
|---|----------------------|-----------------|
| 13.1 | La racine `/` est matchée | ✅ `proxy.test.ts` |
| 13.2 | Les paths localisés sont matchés | ✅ `proxy.test.ts` |
| 13.3 | Les paths `/invite/*` sont matchés | ✅ `proxy.test.ts` |
| 13.4 | Les routes `/api/*` ne sont PAS matchées | ✅ `proxy.test.ts` |
| 13.5 | Les assets statiques sont exclus | ✅ `proxy.test.ts` |
