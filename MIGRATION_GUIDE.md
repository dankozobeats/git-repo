# 🗄️ Migration Supabase - Habit Tracker

## Étapes pour mettre à jour votre base de données

### 1. Connexion à Supabase

Allez sur [app.supabase.com](https://app.supabase.com), sélectionnez votre projet.

### 2. Accès à l'éditeur SQL

1. Navigation → **SQL Editor**
2. Cliquez sur **+ New query**

### 3. Exécutez la migration

Copiez-collez ce script et cliquez sur **Run** :

```sql
-- Migration: Add goal tracking to habits table
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS goal_value INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS goal_type TEXT DEFAULT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS goal_description TEXT DEFAULT NULL;

-- Create an index for better query performance (optionnel)
CREATE INDEX IF NOT EXISTS idx_habits_goal_value ON habits(goal_value);

-- Vérifier que les colonnes ont bien été créées
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'habits'
ORDER BY ordinal_position;
```

### 4. Vérification

Vous devriez voir 3 nouvelles colonnes :
- `goal_value` (integer)
- `goal_type` (text)
- `goal_description` (text)

---

## Alternative: Utiliser les migrations de Supabase

Si vous utilisez les migrations versionnées :

### Via supabase-cli

```bash
# 1. Initialiser (si pas fait)
supabase init

# 2. Créer une migration
supabase migration new add_goal_tracking

# 3. Éditer le fichier créé dans ./supabase/migrations/
# Ajouter le contenu du script ci-dessus

# 4. Appliquer
supabase db push
```

---

## Structure de données

### Table `habits` (modifications)

| Colonne | Type | Notes |
|---------|------|-------|
| id | uuid | PK (existant) |
| user_id | uuid | FK (existant) |
| name | text | (existant) |
| description | text | (existant) |
| icon | text | (existant) |
| color | text | (existant) |
| type | text | 'good' ou 'bad' (existant) |
| is_archived | boolean | (existant) |
| created_at | timestamp | (existant) |
| updated_at | timestamp | (existant) |
| **goal_value** | integer | ✨ NOUVEAU: Nombre de répétitions |
| **goal_type** | text | ✨ NOUVEAU: 'daily', 'weekly', ou 'monthly' |
| **goal_description** | text | ✨ NOUVEAU: Description libre |

### Table `logs` (inchangée mais optimisée)

Les logs existants restent inchangés. Le système supporte maintenant :
- Multiples logs par jour (good et bad habits)
- Timestamps précis avec `created_at`

---

## Rollback (en cas de problème)

Si vous devez revenir en arrière :

```sql
ALTER TABLE habits
DROP COLUMN IF EXISTS goal_value,
DROP COLUMN IF EXISTS goal_type,
DROP COLUMN IF EXISTS goal_description;

DROP INDEX IF EXISTS idx_habits_goal_value;
```

---

## Validation post-migration

Testez avec ce script :

```sql
-- Insérer un test
INSERT INTO habits (user_id, name, color, type, goal_value, goal_type, goal_description)
VALUES (
  'YOUR_USER_ID',
  'Test Habit',
  '#10b981',
  'good',
  3,
  'daily',
  'Test de l''objectif quotidien'
);

-- Vérifier
SELECT id, name, goal_value, goal_type, goal_description FROM habits WHERE name = 'Test Habit';

-- Nettoyer
DELETE FROM habits WHERE name = 'Test Habit';
```

---

## Points importants

✅ **Les données existantes sont conservées**
  - Les colonnes sont NULL par défaut pour les habitudes existantes
  
✅ **Backward compatible**
  - L'ancienne API (sans objectif) fonctionne toujours
  
✅ **Sécurité**
  - `goal_type` a une contrainte CHECK pour éviter les valeurs invalides

---

## Après la migration

1. **Redéployez votre app** pour utiliser le nouveau code
2. **Testez créer une habitude** avec un objectif
3. **Vérifiez le calendrier** qui devrait afficher les couleurs correctes

C'est prêt ! 🚀
