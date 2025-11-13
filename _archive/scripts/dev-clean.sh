#!/bin/bash

echo "🧹 Nettoyage complet..."
echo "⚠️  Attention : Cette action va supprimer les données de la base !"
read -p "Continuer ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd docker
    docker-compose -f docker-compose.dev.yml down -v
    docker system prune -f
    echo "✅ Nettoyage terminé"
fi
