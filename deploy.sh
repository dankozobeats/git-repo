#!/bin/bash

# Configuration
USER="debian"
HOST="51.83.32.24"
REMOTE_DIR="/home/debian/badhabit-tracker"

echo "🚀 Début du déploiement vers $USER@$HOST..."

# 1. Transfert des fichiers (rsync)
echo "📦 Synchronisation des fichiers..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.env*' \
  --exclude 'dist' \
  ./ $USER@$HOST:$REMOTE_DIR

# 2. Installation et Build sur le VPS
echo "🔧 Installation et Build sur le serveur..."
ssh $USER@$HOST << EOF
  # Charger nvm
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

  # Forcer l'utilisation de Node 20
  nvm use 20 || { echo "❌ Node 20 not found. Did you run setup_vps.sh?"; exit 1; }

  echo "Node version: $(node -v)"
  echo "NPM version: $(npm -v)"

  cd $REMOTE_DIR

  # Installation des dépendances App
  echo "Installing App dependencies..."
  npm install

  # Build Next.js
  echo "Building Next.js app..."
  npm run build

  # Installation des dépendances Sender
  echo "Installing Sender dependencies..."
  cd sender
  npm install
  cd ..

  # Redémarrage PM2
  echo "Restarting services..."
  # Si les process existent déjà, on reload, sinon on start
  if pm2 list | grep -q "badhabit-app"; then
    pm2 reload badhabit-app
  else
    pm2 start npm --name "badhabit-app" -- start
  fi

  if pm2 list | grep -q "badhabit-sender"; then
    pm2 reload badhabit-sender
  else
    cd sender
    pm2 start index.js --name "badhabit-sender"
    cd ..
  fi

  pm2 save
EOF

echo "✅ Déploiement terminé !"
