# 🚀 Guide de déploiement - Habit Tracker v2

## Checklist complète avant déploiement

- [ ] Migration base de données appliquée
- [ ] Tous les fichiers créés/modifiés présents
- [ ] Build success (`npm run build`)
- [ ] Tests locaux effectués
- [ ] Variables d'env configurées

---

## Étape 1: Préparation locale

### 1.1 Vérifier les fichiers créés

```bash
cd /Users/cadet/Projects/badhabit-tracker

# Ces fichiers doivent exister:
ls -la app/habits/[id]/HabitCounter.tsx
ls -la app/habits/[id]/HabitCalendar.tsx
ls -la app/habits/[id]/GoalSettingsModal.tsx
ls -la app/habits/[id]/HabitDetailClient.tsx
ls -la app/api/habits/[id]/goal/route.ts
```

### 1.2 Vérifier les modifications

```bash
# Page mise à jour
ls -la app/habits/[id]/page.tsx

# Types mis à jour
ls -la types/database.ts

# API check-in mise à jour
ls -la app/api/habits/[id]/check-in/route.ts
```

### 1.3 Build test

```bash
# Nettoyer
rm -rf .next

# Compiler
npm run build

# Vérifier les erreurs TypeScript
npx tsc --noEmit
```

---

## Étape 2: Migration Supabase

### 2.1 Connexion

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Navigation → **SQL Editor**

### 2.2 Exécuter la migration

```sql
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS goal_value INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS goal_type TEXT DEFAULT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly')),
ADD COLUMN IF NOT EXISTS goal_description TEXT DEFAULT NULL;

-- Optionnel mais recommandé
CREATE INDEX IF NOT EXISTS idx_habits_goal_value ON habits(goal_value);
```

### 2.3 Vérification

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'habits' 
ORDER BY ordinal_position;
```

Vous devez voir les 3 colonnes: `goal_value`, `goal_type`, `goal_description`

---

## Étape 3: Test en développement local

### 3.1 Démarrer le serveur local

```bash
npm run dev
```

### 3.2 Tests à effectuer

#### Test 1: Créer une Good Habit avec objectif
1. Allez sur `/` (dashboard)
2. Créez une habitude "Test Sport" (type: good)
3. Allez sur la page détail
4. Cliquez sur "⚙️ Objectif"
5. Configurez: 3 par jour, "Mon objectif test"
6. Enregistrez
7. **Vérifier**: L'objectif s'affiche dans la modale et le header

#### Test 2: Compteur Good Habit
1. Cliquez "+1 Fait" → 1/3
2. Cliquez "+1 Fait" → 2/3 ("1 action restante")
3. Cliquez "+1 Fait" → 3/3 ("✓ Objectif atteint!")
4. **Vérifier**: Couleurs et textes changent correctement

#### Test 3: Calendrier Good Habit
1. Faites plusieurs jours d'actions
2. **Vérifier**: Calendrier affiche les cases en vert/jaune
3. Survolez une case → tooltip "3/3 ✓"

#### Test 4: Créer une Bad Habit
1. Créez une habitude "Test Smoking" (type: bad)
2. Allez sur la page détail
3. **Vérifier**: Pas de bouton "⚙️ Objectif"
4. Cliquez "J'ai craqué" → compteur passe à 1
5. Cliquez 2 fois de plus → compteur = 3
6. **Vérifier**: Case du jour en rouge intense

#### Test 5: Suppression
1. Cliquez "Retirer" → compteur décrémente
2. **Vérifier**: Calendrier se met à jour

#### Test 6: Statistiques
1. **Vérifier**: Total, Semaine, Streak, % du mois
2. Essayez avec plusieurs jours de logs

---

## Étape 4: Préparation au déploiement

### 4.1 Variables d'environnement

Vérifiez que `.env.local` contient:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 4.2 Build final

```bash
npm run build
npm run start
```

Testez sur `http://localhost:3000`

---

## Étape 5: Déploiement (Vercel/autre)

### 5.1 Vercel

```bash
# Si vous utilisiez Vercel avant
vercel

# Ou via Git (auto-deploy)
git add .
git commit -m "feat: upgrade habit detail page with goals & counters"
git push
```

### 5.2 Alternative: Docker / Auto-hosting

```bash
# Build image
docker build -t badhabit-tracker .

# Tester localement
docker run -p 3000:3000 badhabit-tracker
```

### 5.3 Environment variables en production

Ne pas oublier de configurer dans votre plateforme:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Étape 6: Post-déploiement

### 6.1 Vérifications

- [ ] Page habitude charge sans erreur
- [ ] Compteur fonctionne (add/remove)
- [ ] Modale objectif s'ouvre/ferme
- [ ] Calendrier affiche les couleurs
- [ ] API répond (check network tab)

### 6.2 Monitoring

```bash
# Vérifier les logs
vercel logs --prod

# Ou sur votre serveur
tail -f /var/log/app.log
```

### 6.3 Rollback en cas de problème

```bash
# Si déploiement avec Vercel
vercel rollback

# Ou restaurer le Git
git revert <commit-hash>
git push
```

---

## 🐛 Troubleshooting

### Erreur: "column doesn't exist"
**Solution**: La migration Supabase n'a pas été appliquée. Faites-le via SQL Editor.

### Compteur n'incrémente pas
**Solution**: Vérifier que `POST /api/habits/[id]/check-in` retourne 200. Vérifier les logs du serveur.

### Calendrier ne met pas à jour
**Solution**: `router.refresh()` doit être appelé après chaque action. Vérifier la console pour les erreurs.

### Couleurs mal affichées
**Solution**: Tailwind CSS doit être compilé. Vérifier que `tailwindcss` est dans package.json.

### Modale ne s'ouvre pas (Good Habit)
**Solution**: Vérifier que `HabitType` est 'good' et que le composant est importé. Regarder la console des erreurs.

---

## 📊 Checklist final

Avant de considérer comme "en prod":

- [ ] Tous les tests locaux passent
- [ ] Migration Supabase confirmée
- [ ] Build sans warnings
- [ ] 3 habitudes test créées (2 good, 1 bad)
- [ ] Toutes les interactions testées
- [ ] Performance acceptable (< 3s load)
- [ ] Mobile responsive confirmé
- [ ] Pas de console errors

---

## 🎉 Félicitations!

Votre Habit Tracker est maintenant **à jour et prêt à la production** ! 

Si des bugs apparaissent:
1. Vérifiez les logs
2. Testez localement
3. Créez un issue/ticket
4. Contactez le support Supabase si problème DB

Bon suivi des habitudes! 🚀
