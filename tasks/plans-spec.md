# Feature Spec — Plans & Sondages de disponibilité

> Créé : 2026-04-17
> Statut : En attente d'implémentation

---

## Résumé

Un membre d'un groupe peut créer un **plan** — une proposition de réunion avec plusieurs créneaux. Les autres membres votent leur disponibilité sur chaque créneau. L'événement est créé automatiquement ou manuellement une fois un créneau validé.

---

## 1. Création d'un plan

**Qui peut créer ?** N'importe quel membre du groupe.

**Champs du formulaire :**
| Champ | Type | Requis |
|-------|------|--------|
| Titre | Texte libre | Oui |
| Description | Texte libre | Non |
| Durée estimée | Dropdown (30min, 1h, 2h, 3h, demi-journée, journée entière) | Oui |
| Créneaux proposés | N créneaux (date seule OU date + heure) | Min 2 |
| Quorum | Nombre entier (ex: "4 membres minimum") | Oui |

**Règles des créneaux :**
- Minimum 2 créneaux, pas de maximum défini.
- Chaque créneau peut être : date seule (ex: "Samedi 15 mai") ou date + heure (ex: "Samedi 15 mai à 19h00").
- Le créateur choisit le format par créneau individuellement.

**Quorum :**
- Le créateur définit le nombre minimum de membres "disponibles" requis pour déclencher la validation automatique.
- Ex: quorum = 4 → si 4 membres votent "disponible" sur un même créneau, l'événement est créé automatiquement.
- Le quorum ne peut pas dépasser le nombre de membres actuels du groupe.

---

## 2. Deadline

- Chaque plan expire **3 jours** après sa création (deadline fixe, non configurable).
- À l'expiration, le système tente la validation automatique (voir §4).

---

## 3. Voter sur un plan

**Options de vote :** "Disponible" ✅ / "Pas disponible" ❌ (pas de "peut-être").

**Visibilité :** Les résultats sont visibles en **temps réel** par tous les membres, comme WhatsApp :
- Barre de progression par créneau
- Nombre de votes par créneau
- Avatars des membres ayant voté "disponible" affichés

**Règles :**
- Chaque membre vote une fois par plan (peut modifier son vote tant que le plan est ouvert).
- Un membre peut voter sur plusieurs créneaux (ex: dispo lundi ET mardi).
- Les membres qui rejoignent le groupe après la création du plan peuvent voter.

---

## 4. Validation et création de l'événement

### 4a. Validation manuelle (avant expiration)
- Le créateur du plan peut à tout moment choisir un créneau et valider.
- La validation crée automatiquement un événement dans le groupe.
- L'événement inclut comme participants les membres qui ont voté "disponible" sur ce créneau.
- Le plan passe au statut `resolved`.

### 4b. Validation automatique (quorum atteint)
- Si le nombre de votes "disponible" sur un créneau atteint ou dépasse le quorum → l'événement est créé automatiquement sans intervention du créateur.
- Le plan passe au statut `resolved`.

### 4c. Expiration automatique (3 jours, quorum non atteint)
- Si la deadline est atteinte sans validation manuelle ni quorum :
  - **Cas normal** : le créneau avec le plus de votes "disponible" est choisi automatiquement → événement créé.
  - **Cas égalité** : le créateur est notifié pour choisir manuellement entre les créneaux à égalité. Le plan reste ouvert jusqu'à ce que le créateur choisisse.
  - **Cas 0 vote** : le plan s'archive sans créer d'événement (statut `expired`).

### Participants de l'événement créé
- Le concept de "participants" sur les événements est à définir lors de l'implémentation.
- Option A : ajouter un champ `participants` (array de user_id) sur la table `events`.
- Option B : créer une table `event_participants` séparée.
- À décider à l'implémentation selon l'impact sur les features existantes.

---

## 5. Statuts d'un plan

| Statut | Description |
|--------|-------------|
| `open` | En cours de vote, deadline non atteinte |
| `pending_tiebreak` | Deadline atteinte, égalité, créateur doit choisir |
| `resolved` | Créneau validé, événement créé |
| `expired` | Délai expiré, aucun vote reçu |

---

## 6. Interface utilisateur

### Page groupe
- **Section "Plans"** affichée en haut de la page groupe, avant la liste des événements.
- Visible seulement s'il y a au moins 1 plan ouvert ou récemment résolu.
- Chaque plan affiché en carte avec :
  - Titre, créateur, durée estimée
  - Deadline restante (ex: "Expire dans 2 jours")
  - Liste des créneaux avec barres de vote (style WhatsApp)
  - Boutons voter (si non encore voté) ou modifier son vote
  - Bouton "Valider ce créneau" visible pour le créateur uniquement

### Création d'un plan
- Bouton "Créer un plan" dans la page groupe (accessible à tous les membres).
- Dialog ou page dédiée avec le formulaire de création.

### Dashboard
- Badge de notification sur le nom du groupe si le groupe a un ou plusieurs plans ouverts en attente de vote de l'utilisateur.

### Notifications visuelles
- Badge rouge sur le nom du groupe dans le dashboard et dans la liste des groupes.
- Disparaît une fois que l'utilisateur a voté sur tous les plans ouverts du groupe.

---

## 7. Règles métier supplémentaires

- Un groupe peut avoir **plusieurs plans ouverts simultanément**.
- Seul le créateur du plan peut le supprimer (si le plan est encore `open`).
- Un plan `resolved` ou `expired` reste visible en lecture seule (historique).
- L'événement créé par un plan est un événement normal du groupe (éditable par son créateur).

---

## 8. Schéma de données proposé

### Table `plans`
```sql
id              uuid PK
group_id        uuid FK → groups.id
created_by      uuid FK → profiles.id
title           text NOT NULL
description     text
duration        text NOT NULL  -- '30min', '1h', '2h', '3h', 'half_day', 'full_day'
quorum          integer NOT NULL
status          text NOT NULL DEFAULT 'open'  -- 'open', 'pending_tiebreak', 'resolved', 'expired'
resolved_slot_id uuid FK → plan_slots.id (nullable)
event_id        uuid FK → events.id (nullable, set when resolved)
expires_at      timestamptz NOT NULL  -- created_at + 3 days
created_at      timestamptz DEFAULT now()
```

### Table `plan_slots`
```sql
id          uuid PK
plan_id     uuid FK → plans.id
date        date NOT NULL
time        time (nullable — si créneau avec heure)
position    integer NOT NULL  -- ordre d'affichage
created_at  timestamptz DEFAULT now()
```

### Table `plan_votes`
```sql
id          uuid PK
slot_id     uuid FK → plan_slots.id
user_id     uuid FK → profiles.id
available   boolean NOT NULL  -- true = dispo, false = pas dispo
created_at  timestamptz DEFAULT now()
UNIQUE (slot_id, user_id)
```

### RLS
- `plans` : visible aux membres du groupe (via `is_group_member()`)
- `plan_slots` : visible aux membres du groupe du plan parent
- `plan_votes` : chaque membre voit tous les votes (affichage temps réel), insert/update sur ses propres votes uniquement

---

## 9. API Routes prévues

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/groups/[id]/plans` | Lister les plans d'un groupe |
| `POST` | `/api/groups/[id]/plans` | Créer un plan |
| `GET` | `/api/plans/[id]` | Détail d'un plan |
| `DELETE` | `/api/plans/[id]` | Supprimer un plan (créateur only) |
| `POST` | `/api/plans/[id]/vote` | Voter sur des créneaux |
| `POST` | `/api/plans/[id]/resolve` | Valider un créneau (créateur only) |

---

## 10. i18n — Clés nécessaires (FR/EN)

Namespaces : `plans`

- `plans.title` — "Plans"
- `plans.create` — "Créer un plan"
- `plans.form.title` — "Titre"
- `plans.form.description` — "Description"
- `plans.form.duration` — "Durée estimée"
- `plans.form.quorum` — "Quorum (membres minimum)"
- `plans.form.slots` — "Créneaux proposés"
- `plans.form.addSlot` — "Ajouter un créneau"
- `plans.form.slotDate` — "Date"
- `plans.form.slotTime` — "Heure (optionnel)"
- `plans.vote.available` — "Disponible"
- `plans.vote.unavailable` — "Pas disponible"
- `plans.vote.change` — "Modifier mon vote"
- `plans.deadline` — "Expire dans {days} jour(s)"
- `plans.status.open` — "En cours"
- `plans.status.resolved` — "Résolu"
- `plans.status.expired` — "Expiré"
- `plans.status.pending_tiebreak` — "Égalité — choisissez"
- `plans.resolve.button` — "Valider ce créneau"
- `plans.resolve.confirm` — "Créer l'événement avec ce créneau ?"
- `plans.tiebreak.notification` — "Égalité sur votre plan \"{title}\" — choisissez un créneau"
- `plans.empty` — "Aucun plan en cours"
- `plans.badge` — "{count} plan(s) en attente"

---

## 11. Milestones d'implémentation

- **M11a** — Schéma SQL + RLS + migrations
- **M11b** — API Routes (CRUD plans, votes, resolve)
- **M11c** — UI page groupe (affichage plans, voter, créer)
- **M11d** — Badge dashboard + expiration auto + tiebreak
