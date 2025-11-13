#!/bin/bash

echo "🚀 Démarrage de l'environnement de développement..."
echo ""

# Vérifier Docker
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker n'est pas démarré. Lance Docker Desktop."
    exit 1
fi

# Démarrer les services
cd docker
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "✅ Services démarrés !"
echo ""
echo "📍 Accès :"
echo "   Frontend : http://localhost:5173"
echo "   Backend  : http://localhost:3000"
echo "   Database : localhost:5432"
echo ""
echo "📊 Commandes utiles :"
echo "   Logs      : ./scripts/dev-logs.sh"
echo "   Arrêter   : ./scripts/dev-stop.sh"
echo "   Redémarrer: ./scripts/dev-restart.sh"
