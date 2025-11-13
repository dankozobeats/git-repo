#!/bin/bash

echo "🛑 Arrêt de l'environnement de développement..."
cd docker
docker-compose -f docker-compose.dev.yml down
echo "✅ Services arrêtés"
