#!/bin/bash

# Script d'installation initial pour le VPS (à exécuter une seule fois sur le serveur)
# Usage: ./setup_vps.sh

echo "🛠️ Configuration du VPS..."

# 1. Mise à jour système
sudo apt update && sudo apt upgrade -y

# 2. Installation Node.js (via NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20

# 3. Installation PM2
npm install -g pm2

# 4. Installation Nginx
sudo apt install -y nginx

# 5. Configuration Firewall (UFW)
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

echo "✅ Installation terminée. Veuillez configurer Nginx et copier vos fichiers .env."
