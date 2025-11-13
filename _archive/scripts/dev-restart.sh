#!/bin/bash

echo "🔄 Redémarrage de l'environnement..."
cd docker
docker-compose -f docker-compose.dev.yml restart
echo "✅ Services redémarrés"
