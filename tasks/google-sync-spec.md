# Google Calendar Sync — Spec V1

> Date: 23 mars 2026
> Status: Approuvé (toutes les questions résolues)

---

## Vue d'ensemble

Import one-way (Google → Together) des événements Google Calendar.
Le user connecte un ou plusieurs comptes Google, choisit ses calendriers,
et voit les nouveaux événements apparaître comme suggestions à accepter/refuser
sur une page dédiée "Google Sync".

---

## Décisions produit (Batches 1-6)

### Batch 1 — Modèle de sync

| # | Question | Réponse |
|---|----------|---------|
| 1 | Sync continue ou one-shot ? | **Continue** — les nouveaux événements Google apparaissent comme suggestions à accepter/refuser au fil du temps |
| 2 | Sélection des événements ? | **A) Liste avec checkboxes** — liste d'événements Google avec checkboxes pour accepter/refuser |
| 3 | Événements récurrents Google ? | **B) Série entière** — on importe la série entière d'un coup (toutes les occurrences sur la plage) |

### Batch 2 — Données & Sync live

| # | Question | Réponse |
|---|----------|---------|
| 4 | Quoi garder à l'import ? | **C) Le user choisit** — par événement : détails complets ou mode "Occupé" |
| 5 | Si événement Google modifié/supprimé ? | **A) Sync live** — les modifs/suppressions Google se répercutent automatiquement dans Together |
| 6 | Multi-comptes Google ? | **Oui, plusieurs** — un user peut connecter plusieurs comptes (perso + pro) |

### Batch 3 — Fréquence & Visibilité

| # | Question | Réponse |
|---|----------|---------|
| 7 | Fréquence de sync ? | **C) À chaque ouverture de l'app** uniquement |
| 8 | Visibilité groupe ? | **Ça dépend des choix** — dépend du choix fait à l'import (Q4 : détails vs Occupé) |
| 9 | Plage de 3 mois ? | **A) Fixe** — toujours 3 mois glissants |

### Batch 4 — UX & Navigation

| # | Question | Réponse |
|---|----------|---------|
| 10 | Où connecter Google ? | **A) Settings du profil** |
| 11 | Où voir les suggestions ? | **A) Page/onglet dédié "Google Sync"** |
| 12 | Déconnexion Google ? | **A) Suppression auto** — les événements importés sont supprimés automatiquement |

### Batch 5 — Calendriers & Volume

| # | Question | Réponse |
|---|----------|---------|
| 13 | Choix des calendriers Google ? | **Oui** — le user peut choisir quels calendriers Google il veut voir dans la page de sync |
| 14 | Conflits horaires ? | **A) Coexistent** — les deux événements coexistent, aucun blocage |
| 15 | Volume d'affichage ? | **Tout d'un coup** — la page sync affiche tout d'un coup (pas de pagination) |

### Batch 6 — Visuel & Limites

| # | Question | Réponse |
|---|----------|---------|
| 16 | Marquage visuel ? | **Oui, petit badge** — badge "G" ou similaire sur les événements importés |
| 17 | Mobile / Desktop ? | **Partout** — doit marcher sur mobile et desktop dès le départ |
| 18 | Hors scope V1 ? | **Confirmé** : sync bidirectionnelle, export iCal, Apple/Outlook, notifications de rappel |

---

## Résumé fonctionnel

### Connexion
- Bouton "Connecter Google Calendar" dans les **settings du profil**
- OAuth 2.0 avec scope `calendar.readonly`
- Support **multi-comptes** (perso + pro)
- Déconnexion → **suppression auto** de tous les événements importés depuis ce compte

### Sélection des calendriers
- Après connexion, l'app récupère la liste des calendriers du compte Google
- Le user **choisit quels calendriers** il veut synchroniser (checkboxes)
- Peut modifier sa sélection à tout moment

### Sync continue
- **Déclenchée à chaque ouverture de l'app** (pas de webhooks, pas de polling)
- Plage : **3 mois glissants** (fixe)
- Les nouveaux événements Google → statut **"pending"** (suggestion)
- Les événements Google modifiés → **mise à jour auto** dans Together (si acceptés)
- Les événements Google supprimés → **suppression auto** dans Together (si acceptés)

### Page "Google Sync"
- Page/onglet dédié accessible depuis la navigation
- **Affiche tout d'un coup** (pas de pagination)
- Liste d'événements avec **checkboxes** pour accepter/refuser
- Pour chaque événement : choix **"Détails complets" ou "Occupé"**
- Les événements récurrents sont importés comme **série entière** (toutes les occurrences)

### Visibilité
- Les événements importés sont visibles par le **groupe** (comme tout événement)
- Le mode d'affichage dépend du choix à l'import : détails ou "Occupé"
- **Badge "G"** visible sur les événements importés dans toutes les vues calendrier

### Conflits
- Pas de gestion de conflits : les événements **coexistent** librement

---

## Hors scope V1

- Sync bidirectionnelle (Together → Google)
- Export iCal
- Import depuis Apple Calendar / Outlook
- Notifications de rappel sur événements importés
- Webhooks / sync temps réel
- Pagination sur la page sync
- Détachement d'événements (rendre indépendant de Google)
