# Système Trackables

## Vue d'ensemble

Le système **Trackables** est une nouvelle architecture qui unifie et clarifie le suivi des habitudes et des états mentaux/physiques. Il sépare clairement :

- **Habitudes** (`type: 'habit'`) - Actions volontaires que tu veux accomplir (exercice, méditation, lecture)
- **États** (`type: 'state'`) - Signaux observés que tu surveilles (pulsions, fatigue, stress)
- **Décisions** - Réponses conscientes aux états observés (résister, craquer, reporter, remplacer)

## Architecture

### Base de données

```
trackables (habits + states)
  ├── trackable_events (logs unifiés)
  │   └── decisions (réponses aux états observés)
  └── daily_stats (vue agrégée)
```

### Tables principales

#### `trackables`
- `type`: 'habit' ou 'state'
- `name`: Nom du trackable
- `is_priority`: Affiché dans la section prioritaire
- `target_per_day`: Objectif quotidien (pour habits)
- `unit`: Unité de mesure (minutes, pages, fois...)

#### `trackable_events`
- `kind`: 'check' (pour habits) ou 'observe' (pour states)
- `occurred_at`: Timestamp de l'événement
- `value_int` / `value_float`: Valeurs quantifiables
- `meta_json`: Métadonnées contextuelles (intensité, contexte, notes...)

#### `decisions`
- `decision`: 'resist', 'relapse', 'delay', 'replace', 'other'
- `amount`: Montant dépensé (pour 'relapse')
- `delay_minutes`: Durée du report (pour 'delay')
- `replacement_action`: Action alternative (pour 'replace')

## Installation

### 1. Appliquer la migration SQL

Dans l'éditeur SQL de Supabase, exécute le contenu du fichier :
```
migrations/016_trackables_events_decisions.sql
```

Ou copie-colle tout le contenu de ce fichier dans l'éditeur SQL et exécute.

### 2. Créer des trackables de test (optionnel)

```sql
-- Trouver ton user_id
SELECT id FROM auth.users WHERE email = 'ton@email.com';

-- Créer des exemples (remplace YOUR_USER_ID)
INSERT INTO public.trackables (user_id, type, name, icon, color, is_priority, target_per_day, unit)
VALUES
  ('YOUR_USER_ID', 'habit', 'Méditation', '🧘', '#6366f1', true, 1, 'session'),
  ('YOUR_USER_ID', 'state', 'Pulsion d''achat', '🛍️', '#f59e0b', true);
```

### 3. Accéder au dashboard

Visite : `http://localhost:3000/trackables`

## Utilisation

### Flow pour une Habitude (3 taps max)

1. **Voir la carte** de l'habitude dans "Habitudes Prioritaires"
2. **Cliquer** sur la carte pour marquer comme complété
3. ✅ **Done** - La progression se met à jour automatiquement

### Flow pour un État (3 taps max)

1. **Cliquer** sur l'état dans "États à Surveiller"
2. **Sélectionner** l'intensité (1-5) et le contexte → "Observer"
3. **Choisir** la décision (Résisté / Craqué / Reporté / Remplacé)
4. ✅ **Done** - Les stats se mettent à jour

## API Routes

### Trackables
- `GET /api/trackables` - Liste tous les trackables
- `POST /api/trackables` - Créer un nouveau trackable
- `GET /api/trackables/[id]` - Récupérer un trackable
- `PATCH /api/trackables/[id]` - Mettre à jour un trackable
- `DELETE /api/trackables/[id]` - Archiver un trackable

### Events
- `GET /api/trackable-events` - Liste les événements
- `POST /api/trackable-events` - Logger un événement (check/observe)

### Decisions
- `GET /api/decisions` - Liste les décisions
- `POST /api/decisions` - Créer une décision

### Stats
- `GET /api/stats/trackables-dashboard` - Stats agrégées (aujourd'hui + semaine)

## Hooks React

### `useTrackables()`
Hook principal pour gérer les trackables.

```typescript
const {
  trackables,           // Liste avec les données du jour
  isLoading,
  error,
  refresh,              // Recharger les données
  createTrackable,      // Créer un trackable
  updateTrackable,      // Mettre à jour
  archiveTrackable,     // Archiver
  logEvent,             // Logger un événement
  createDecision,       // Créer une décision
} = useTrackables()
```

### `useTrackableStats()`
Hook pour les statistiques du dashboard.

```typescript
const {
  stats,                // DashboardStats
  isLoading,
  error,
  refresh,
} = useTrackableStats()
```

## Composants UI

### `<TrackablePriorityCard />`
Carte pour afficher un trackable avec ses stats du jour.

### `<ObserveStateSheet />`
Bottom sheet pour observer un état :
- Sélection d'intensité (1-5)
- Contextes pré-définis (stress, ennui, fatigue, promo, social)
- Déclencheur et notes (optionnels)

### `<DecisionSheet />`
Bottom sheet pour prendre une décision :
- 4 options visuelles : Résisté, Craqué, Reporté, Remplacé
- Champs conditionnels (montant, durée, action de remplacement)

### `<TrackablesDashboard />`
Dashboard principal qui combine tous les composants.

## Exemples d'usage

### Créer un trackable

```typescript
await createTrackable({
  type: 'habit',
  name: 'Méditation',
  icon: '🧘',
  color: '#6366f1',
  is_priority: true,
  target_per_day: 1,
  unit: 'session',
})
```

### Logger une habitude

```typescript
await logEvent({
  trackable_id: 'habit-uuid',
  kind: 'check',
  value_int: 1,
})
```

### Observer un état + Créer une décision

```typescript
// 1. Observer l'état
const event = await logEvent({
  trackable_id: 'state-uuid',
  kind: 'observe',
  meta_json: {
    intensity: 4,
    context: 'stress',
    trigger: 'Travail',
  },
})

// 2. Prendre une décision
await createDecision({
  state_event_id: event.id,
  decision: 'resist',
})
```

## Migration des données existantes

Le système Trackables coexiste avec l'ancien système `habits`. Tu peux :

1. **Garder les deux systèmes en parallèle** pendant la transition
2. **Migrer progressivement** en créant des trackables équivalents
3. **Utiliser un script de migration** (à créer si besoin)

Le nouveau système ne touche PAS aux tables `habits`, `logs`, `habit_events` existantes.

## Stats calculées

### Aujourd'hui
- Habitudes complétées vs objectif
- Nombre de résistances
- Nombre de craquages
- Montant total dépensé

### Cette semaine
- Total habitudes complétées
- Total résistances / craquages
- Taux de résistance moyen (%)

## Avantages du système

✅ **UX ultra-rapide** : 3 taps maximum pour tout tracker
✅ **Séparation claire** : Habitudes vs États vs Décisions
✅ **Données riches** : Métadonnées contextuelles (intensité, contexte, triggers)
✅ **Stats précises** : "Bonnes actions" vs "Craquages" calculés correctement
✅ **Évolutif** : Facile d'ajouter de nouveaux types de décisions ou métadonnées
✅ **Rétrocompatible** : Ne casse pas l'ancien système

## Prochaines étapes

- [ ] Créer un formulaire pour ajouter des trackables depuis l'UI
- [ ] Ajouter des graphiques de progression
- [ ] Implémenter l'analyse de patterns sur les états observés
- [ ] Créer des notifications intelligentes basées sur les patterns
- [ ] Migrer les données de l'ancien système (si souhaité)
