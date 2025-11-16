# 📊 Habit Tracker - Évolution Page Détail

## 🎯 Vue d'ensemble

J'ai transformé la page de détail d'une habitude en une interface complète et moderne supportant :

- **Compteur adaptatif** : système d'objectif pour les bonnes habitudes, craquages illimités pour les mauvaises
- **Calendrier moderne** : avec couleurs, hover effects, et tooltips informatifs
- **Paramétrage d'objectif** : interface modale pour définir des objectifs chiffrés avec périodicité
- **Statistiques enrichies** : total, semaine, streak, pourcentage du mois

---

## 📁 Fichiers créés/modifiés

### 1. **Types & Schéma** (`types/database.ts`)
Ajout des champs pour les objectifs :
```typescript
goal_value: number | null          // Ex: 3
goal_type: 'daily' | 'weekly' | 'monthly' | null  // Périodicité
goal_description: string | null    // "Faire 3 séances de sport par semaine"
```

### 2. **API Routes**

#### `app/api/habits/[id]/check-in/route.ts` (UPDATE)
- **POST** : Enregistre une nouvelle répétition/craquage
  - Retourne le `count` du jour et `goalReached` (booléen)
  - Permet multiples entrées par jour (good & bad habits)
  
- **GET** : Récupère le compte du jour
  - Retourne `count` et liste des logs
  
- **DELETE** : Supprime le log le plus récent du jour
  - Retourne le nouveau `count`

#### `app/api/habits/[id]/goal/route.ts` (NOUVEAU)
- **PUT** : Crée/met à jour l'objectif
  - Body: `{ goal_value, goal_type, goal_description }`
  
- **GET** : Récupère les paramètres d'objectif actuels

### 3. **Composants UI**

#### `app/habits/[id]/HabitCounter.tsx` (NOUVEAU)
Composant du compteur avec deux designs adaptés :

**Good Habits:**
```
      3
    -----
      5
```
- Affiche "X / Objectif"
- Barre de progression
- Indique "X actions restantes" ou "✓ Objectif atteint"
- Boutons "+1 Fait" et "Retirer"

**Bad Habits:**
```
      7
Craquages
```
- Affiche le nombre total
- Boutons "J'ai craqué" et "Annuler"
- Message spécial si 0 craquages

#### `app/habits/[id]/HabitCalendar.tsx` (NOUVEAU)
Calendrier interactif avec :
- **Couleurs adaptées** :
  - Red (bad habits) : intensité = nombre de craquages
  - Green (good habits) : vert si objectif atteint, jaune si partiel
  - Gray : aucune action
  
- **Hover effects** : scale + shadow + tooltip
  - Affiche la date et le nombre d'actions
  - Pour good habits : "X/Y ✓" si atteint
  - Pour bad habits : "X craquage(s)"

- **Organisation** :
  - Mois repliables/dépliables
  - Barre de progression par mois
  - Grille 7 jours de la semaine

#### `app/habits/[id]/GoalSettingsModal.tsx` (NOUVEAU)
Interface modale pour paramétrer les objectifs :
- Sélecteur du nombre (±1 ou input)
- Choix de périodicité (Jour/Semaine/Mois)
- Description libre (optionnel)
- Préview du résumé
- Boutons Enregistrer/Supprimer/Annuler

#### `app/habits/[id]/HabitDetailClient.tsx` (NOUVEAU)
Composant client principal qui orchestre :
- Header avec actions (Objectif, Modifier, Supprimer)
- Section "Aujourd'hui" avec le compteur
- Statistiques (Total, Semaine, Streak, %)
- Calendrier historique
- Message contextuel motivant

### 4. **Page Serveur** (`app/habits/[id]/page.tsx`)
- Récupère les données Supabase
- Agrège les logs par date
- Calcule les statistiques
- Passe les props au composant client

---

## 🎨 Design & UX

### Palette de couleurs
- **Good Habits** :
  - Primary: Green-600 (objectif atteint)
  - Secondary: Yellow-500 (partiel)
  - Background: Green-900/10
  
- **Bad Habits** :
  - Primary: Red-600 (craquage)
  - Intense: Red-700 (3+ craquages)
  - Background: Red-900/10

### Composants interactifs
- Boutons avec hover + transitions
- Tooltips au survol (calendrier)
- Modale backdrop blur
- Progress bars animées

---

## 📊 Flux de données

### Ajouter une répétition (Good Habit)
1. Clic "+1 Fait" → `POST /api/habits/[id]/check-in`
2. Enregistre un log `{ habit_id, user_id, completed_date, created_at }`
3. Retour : `{ success, count, goalReached }`
4. Update local state + `router.refresh()` pour le calendrier

### Enregistrer un craquage (Bad Habit)
Même flux, mais sans limite de craquages par jour

### Configurer un objectif
1. Clic "Objectif" → GoalSettingsModal s'ouvre
2. Remplir valeur (1-99), périodicité, description
3. Clic "Enregistrer" → `PUT /api/habits/[id]/goal`
4. Mise à jour du `<Habit>` dans Supabase
5. Fermeture modale + refresh

---

## 🚀 Fonctionnalités implémentées

### ✅ Good Habits
- [x] Compteur "X / Objectif"
- [x] Affichage des actions restantes
- [x] État "Objectif atteint" + possibilité de continuer
- [x] Paramétrage d'objectif (valeur, périodicité, description)
- [x] Calendrier avec vert/jaune selon l'atteinte

### ✅ Bad Habits
- [x] Compteur illimité de craquages
- [x] Bouton "J'ai craqué" toujours actif
- [x] Calendrier avec gradation rouge (intensité = count)
- [x] Aucun paramétrage d'objectif

### ✅ Calendrier
- [x] 90 jours d'historique
- [x] Regroupement par mois (accordéon)
- [x] Couleurs adaptées (good/bad)
- [x] Hover + tooltips
- [x] Barre de progression par mois
- [x] Grille avec jours de la semaine

### ✅ Statistiques
- [x] Total 90 jours
- [x] Semaine (7 derniers jours)
- [x] Streak (jours consécutifs)
- [x] Pourcentage du mois actuel

---

## 🔌 Intégration dans votre app

### Prérequis Supabase
Assurez-vous que la table `habits` inclut les colonnes :
```sql
-- Migration à faire
ALTER TABLE habits ADD COLUMN goal_value INTEGER DEFAULT NULL;
ALTER TABLE habits ADD COLUMN goal_type TEXT DEFAULT NULL; -- 'daily', 'weekly', 'monthly'
ALTER TABLE habits ADD COLUMN goal_description TEXT DEFAULT NULL;
```

### Import des composants
```typescript
import HabitDetailClient from './HabitDetailClient'
import HabitCounter from './HabitCounter'
import HabitCalendar from './HabitCalendar'
import GoalSettingsModal from './GoalSettingsModal'
```

---

## 🎯 Exemples de cas d'usage

### Cas 1: "Je veux faire 3 séances de sport par semaine"
1. Créer une bonne habitude "Sport" 💪
2. Clic "Objectif"
3. Valeur: 3, Périodicité: Par semaine
4. Description: "3 séances pour rester en forme"
5. Chaque clic "+1 Fait" incrémente
6. Quand 3 atteints → message "✓ Objectif atteint!"

### Cas 2: "J'arrête de fumer"
1. Créer une mauvaise habitude "Cigarette" 🔥
2. Aucun paramétrage d'objectif
3. Chaque fois que tu craques → clic "J'ai craqué"
4. Le calendrier affiche le nombre en red/darker-red
5. Fais un streak sans craquage = progression!

---

## 🔄 Flux complet (exemple)

**Jour 1 - Matin**
- Page de détail affiche "Objectif: 3/jour"
- Clic "+1" → API retourne count=1
- Compteur met à jour → "1/3" + "2 actions restantes"

**Jour 1 - Midi**
- Clic "+1" → count=2
- Compteur: "2/3" + "1 action restante"

**Jour 1 - Soir**
- Clic "+1" → count=3
- Compteur: "3/3" + "✓ Objectif atteint!"
- Possibilité de cliquer encore (bonus)

**Affichage calendrier**
- Case du jour en vert (objectif atteint)
- Tooltip au survol: "3/3 ✓"

---

## 📝 Notes d'implémentation

1. **Timestamps**: Les logs enregistrent `created_at` pour permettre un tri chronologique futur
2. **Suppression**: Le bouton "Retirer" supprime le log **le plus récent** du jour
3. **Refresh**: Chaque action appelle `router.refresh()` pour synchroniser le calendrier
4. **Modal**: `GoalSettingsModal` utilise `useState` pour les inputs
5. **Colorization**: Les couleurs utilisent Tailwind + couleur d'habitude stockée

---

## 🚦 Prochaines étapes possibles

- [ ] Notifications de rappel
- [ ] Export des données (CSV)
- [ ] Graphiques de tendance (recharts)
- [ ] Partage de streak avec amis
- [ ] Badges/achievements
- [ ] Paramètres par périodicité (ex: "reset hebdo le lundi")

---

## ✨ Résumé

Tu as maintenant une page de détail **complète et professionnelle** avec :
- Compteur intelligent (good vs bad)
- Calendrier moderne et interactif
- Système d'objectif flexible
- Statistiques enrichies
- Design cohérent et accessible

Le tout est prêt à être déployé ! 🚀
