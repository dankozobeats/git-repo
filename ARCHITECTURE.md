# 📐 Architecture des composants - Page Détail

## 🏗️ Hiérarchie des composants

```
page.tsx (Server Component)
├── récupère les données Supabase
├── calcule les stats
└── rend HabitDetailClient

    HabitDetailClient.tsx (Client Component)
    ├── state: isGoalModalOpen, count
    ├── handlers: getContextualMessage()
    └── rend:
        ├── Header (avec boutons)
        ├── Section "Aujourd'hui"
        │   └── HabitCounter
        │       ├── Pour Good: compteur X/objectif
        │       └── Pour Bad: compteur illimité
        ├── Section "Statistiques"
        │   └── 4 cards (Total, Semaine, Streak, %)
        ├── Section "Calendrier"
        │   └── HabitCalendar
        │       ├── Accordéon par mois
        │       └── Grille 7 colonnes
        ├── Section "Message"
        └── GoalSettingsModal
            └── Visible si isGoalModalOpen
```

---

## 📝 Props flow

### page.tsx → HabitDetailClient

```typescript
type Props = {
  habit: {
    id: string
    name: string
    description: string | null
    icon: string | null
    color: string
    type: 'good' | 'bad'
    goal_value: number | null
    goal_type: 'daily' | 'weekly' | 'monthly' | null
    goal_description: string | null
  }
  months: Array<{
    key: string
    name: string
    days: Array<{
      date: string
      dayNumber: number
      monthName: string
      monthKey: string
      count: number
      isCompleted: boolean
      isToday: boolean
    }>
    loggedCount: number
    totalDays: number
    percentage: number
  }>
  todayCount: number
  totalLogs: number
  last7Days: number
  currentStreak: number
}
```

### HabitDetailClient → HabitCounter

```typescript
type Props = {
  habitId: string
  habitType: 'good' | 'bad'
  goalValue?: number | null
  goalType?: string | null
  todayCount: number
  onCountChange?: (newCount: number) => void
}
```

### HabitDetailClient → HabitCalendar

```typescript
type Props = {
  months: Array<Month>
  isBadHabit: boolean
  actionText: string
  goalValue?: number | null
}
```

### HabitDetailClient → GoalSettingsModal

```typescript
type Props = {
  habitId: string
  currentGoal?: {
    goal_value: number | null
    goal_type: 'daily' | 'weekly' | 'monthly' | null
    goal_description: string | null
  }
  isOpen: boolean
  onClose: () => void
}
```

---

## 🔄 Data flow (Mutations)

### Ajouter une répétition

```
User clicks "+1 Fait"
    ↓
HabitCounter.handleAddRepetition()
    ↓
POST /api/habits/[id]/check-in
    ↓
Server insère un log
    ↓
Retourne { success, count, goalReached }
    ↓
setCount(newCount)
    ↓
router.refresh() (revalidate page data)
    ↓
HabitCalendar recompute with new count
```

### Supprimer une répétition

```
User clicks "Retirer"
    ↓
HabitCounter.handleRemoveRepetition()
    ↓
DELETE /api/habits/[id]/check-in
    ↓
Server delete latest log for today
    ↓
Retourne { success, count }
    ↓
setCount(newCount)
    ↓
router.refresh()
```

### Définir un objectif

```
User clicks "⚙️ Objectif"
    ↓
setIsGoalModalOpen(true)
    ↓
GoalSettingsModal appears
    ↓
User configures goal + clicks "Enregistrer"
    ↓
PUT /api/habits/[id]/goal
    ↓
Server updates habit columns (goal_value, goal_type, goal_description)
    ↓
onClose() → setIsGoalModalOpen(false)
    ↓
router.refresh()
    ↓
HabitDetailClient rerender avec nouvelles props
```

---

## 🎯 État (State)

### HabitDetailClient
```typescript
const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
const [count, setCount] = useState(todayCount)
```

### HabitCounter
```typescript
const [count, setCount] = useState(initialCount)
const [isLoading, setIsLoading] = useState(false)
```

### HabitCalendar
```typescript
const [openMonths, setOpenMonths] = useState<Set<string>>(new Set([...]))
const [hoveredDate, setHoveredDate] = useState<string | null>(null)
```

### GoalSettingsModal
```typescript
const [isLoading, setIsLoading] = useState(false)
const [goalValue, setGoalValue] = useState(currentGoal?.goal_value || 1)
const [goalType, setGoalType] = useState<'daily' | 'weekly' | 'monthly'>(...)
const [goalDescription, setGoalDescription] = useState(currentGoal?.goal_description || '')
const [error, setError] = useState('')
```

---

## 🔌 API Endpoints utilisés

### GET /api/habits/[id]/check-in
**Récupère** le count du jour

**Réponse**:
```json
{
  "count": 3,
  "logs": [
    { "id": "...", "created_at": "2025-11-16T..." },
    { "id": "...", "created_at": "2025-11-16T..." }
  ]
}
```

### POST /api/habits/[id]/check-in
**Crée** un nouveau log pour aujourd'hui

**Réponse**:
```json
{
  "success": true,
  "count": 3,
  "goalReached": true
}
```

### DELETE /api/habits/[id]/check-in
**Supprime** le log le plus récent d'aujourd'hui

**Réponse**:
```json
{
  "success": true,
  "count": 2
}
```

### GET /api/habits/[id]/goal
**Récupère** les paramètres d'objectif

**Réponse**:
```json
{
  "goal_value": 3,
  "goal_type": "daily",
  "goal_description": "3 fois par jour"
}
```

### PUT /api/habits/[id]/goal
**Met à jour** l'objectif

**Body**:
```json
{
  "goal_value": 3,
  "goal_type": "daily",
  "goal_description": "3 fois par jour"
}
```

**Réponse**:
```json
{
  "success": true,
  "data": { /* habit object */ }
}
```

---

## 🎨 Styles & Classes Tailwind

### HabitCounter - Good Habit
```typescript
// Container
'bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/40'

// Progress bar
'bg-green-500' // when goalReached
'bg-yellow-500' // when partial

// Buttons
'bg-gradient-to-r from-green-600 to-green-500'
```

### HabitCounter - Bad Habit
```typescript
// Container
'bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-700/40'

// Buttons
'bg-gradient-to-r from-red-600 to-red-500'
```

### HabitCalendar
```typescript
// Day completed (good)
'bg-green-600 text-white border border-green-500 shadow-lg shadow-green-900/50'

// Day partial (good)
'bg-yellow-500 text-white border border-yellow-400'

// Day completed (bad, 1 crack)
'bg-red-500 text-white border border-red-400'

// Day completed (bad, 3+ cracks)
'bg-red-700 text-white border border-red-600 shadow-lg shadow-red-900/50'

// Day empty
'bg-gray-800/40 text-gray-500 border border-gray-700/50'
```

---

## 🧪 Testing suggestions

### Unit tests (HabitCounter)
```javascript
describe('HabitCounter', () => {
  it('increments count on +1 click', () => { /* ... */ })
  it('shows goal reached message', () => { /* ... */ })
  it('disables retirer button when count = 0', () => { /* ... */ })
})
```

### Integration tests
```javascript
describe('Habit Detail Page', () => {
  it('loads habit with data', () => { /* ... */ })
  it('updates calendar after adding event', () => { /* ... */ })
  it('saves goal settings', () => { /* ... */ })
})
```

### E2E tests (Playwright/Cypress)
```javascript
describe('User journey', () => {
  it('creates habit, sets goal, adds daily count', () => { /* ... */ })
})
```

---

## 📦 Dependencies

Aucune nouvelle dépendance requise! Le projet utilise déjà:
- `next` (16.0.3)
- `react` (19.2.0)
- `lucide-react` (icônes)
- `tailwindcss` (styles)

---

## 🔐 Sécurité

### Authentification
- Tous les endpoints vérifient `await supabase.auth.getUser()`
- Les données sont filtrées par `user_id`

### Validation
- `goal_type` a une contrainte CHECK en DB
- `goal_value` doit être >= 1 en frontend + backend
- Les logs sont propriété de l'user (Row Level Security)

### CORS
- Les requêtes API sont dans le même domaine
- Pas de problèmes CORS attendus

---

## 📈 Performance

### Optimisations déjà en place
- `HabitDetailClient` est client component (hydration fast)
- Calendrier n'affiche que 90 jours (pageable si besoin)
- Mois accordéon (lazy rendering)
- `router.refresh()` au lieu de refetch manuel

### Possibles améliorations futures
- Ajouter pagination au calendrier (30j à la fois)
- Cacher les anciens mois en frontend (virtualization)
- Cache avec SWR pour les stats

---

C'est une architecture **solide, scalable et maintenable** ! 🎉
