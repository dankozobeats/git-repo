#!/bin/bash

set -e

BRANCH="fix/timezone-reminders"

echo "🚀 Mise à jour du projet…"
git checkout main
git pull origin main

echo "🌱 Création de la branche $BRANCH…"
git checkout -b $BRANCH || git checkout $BRANCH

echo "📦 Ajout des modifications…"
git add .

echo "📝 Entre ton message de commit :"
read COMMIT_MSG

git commit -m "$COMMIT_MSG"

echo "⬆️ Push vers GitHub…"
git push -u origin $BRANCH

echo "⚡ Déploiement Vercel en production…"
vercel deploy --prod

echo "✅ Déploiement terminé."

