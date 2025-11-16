#!/bin/bash

# 🚀 Habit Tracker v2 - Quick Start Commands
# Utiliser ce fichier comme référence pour les commandes clés

echo "📦 Habit Tracker v2 - Commands Reference"
echo "=========================================="
echo ""

# Development
echo "🔧 DEVELOPMENT"
echo "npm run dev              # Démarrer le serveur de développement"
echo "npm run build            # Compiler le projet"
echo "npm run start            # Démarrer en production"
echo "npm run lint             # Vérifier le linting"
echo ""

# Database
echo "🗄️  DATABASE (Supabase)"
echo "# 1. Aller sur app.supabase.com"
echo "# 2. SQL Editor → New Query"
echo "# 3. Copier la migration (voir MIGRATION_GUIDE.md)"
echo ""

# Testing
echo "🧪 TESTING"
echo "# Tests manuels à effectuer:"
echo "1. Créer good habit avec objectif"
echo "2. Tester +1 Fait → vérifier compteur"
echo "3. Vérifier calendrier (vert/jaune)"
echo "4. Créer bad habit"
echo "5. Tester J'ai craqué → craquages"
echo "6. Vérifier calendrier (rouge dégradé)"
echo ""

# Deployment
echo "🚀 DEPLOYMENT"
echo "git add ."
echo "git commit -m 'feat: upgrade habit detail page v2'"
echo "git push                 # Pour auto-deploy sur Vercel/alternative"
echo "vercel                   # Si déploiement manuel"
echo ""

# Troubleshooting
echo "🐛 TROUBLESHOOTING"
echo "tail -f ~/.pm2/logs/app.log              # Logs de l'app"
echo "vercel logs --prod                       # Logs Vercel"
echo "curl http://localhost:3000/api/health    # Test endpoint"
echo ""

# Important Files
echo "📋 FICHIERS IMPORTANTS"
echo "IMPLEMENTATION_SUMMARY.md    # Résumé complet"
echo "FEATURE_HABIT_DETAIL.md      # Guide feature détaillé"
echo "DESIGN_GUIDE.md              # Design mockups"
echo "ARCHITECTURE.md              # Structure composants"
echo "MIGRATION_GUIDE.md           # Migration DB"
echo "DEPLOYMENT_GUIDE.md          # Checklist déploiement"
echo ""

# Component Locations
echo "📂 NOUVEAUX COMPOSANTS"
echo "app/habits/[id]/HabitCounter.tsx"
echo "app/habits/[id]/HabitCalendar.tsx"
echo "app/habits/[id]/GoalSettingsModal.tsx"
echo "app/habits/[id]/HabitDetailClient.tsx"
echo "app/api/habits/[id]/goal/route.ts"
echo ""

# Code Snippets
echo "📝 SNIPPETS UTILES"
echo ""
echo "# Tester l'API check-in"
echo "curl -X POST http://localhost:3000/api/habits/[HABIT_ID]/check-in"
echo ""
echo "# Récupérer objectif"
echo "curl http://localhost:3000/api/habits/[HABIT_ID]/goal"
echo ""
echo "# Mettre à jour objectif"
echo 'curl -X PUT http://localhost:3000/api/habits/[HABIT_ID]/goal \'
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"goal_value\": 3, \"goal_type\": \"daily\", \"goal_description\": \"Test\"}'"
echo ""

echo "✅ Ready to go! Start with: npm run dev"
