#!/bin/bash

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "🚀 =========================================="
echo "   HABITS TRACKER V12 - SETUP ENVIRONNEMENT"
echo "========================================== ��"
echo ""

# ============================================
# 1. VÉRIFICATION DES PRÉREQUIS
# ============================================

echo "${BLUE}📋 Vérification des prérequis...${NC}"
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "${RED}❌ Docker n'est pas installé${NC}"
    echo "${YELLOW}   → Télécharge Docker Desktop : https://www.docker.com/products/docker-desktop${NC}"
    exit 1
else
    echo "${GREEN}✅ Docker installé :${NC} $(docker --version)"
fi

# Vérifier que Docker tourne
if ! docker info &> /dev/null; then
    echo "${RED}❌ Docker n'est pas démarré${NC}"
    echo "${YELLOW}   → Lance Docker Desktop depuis Applications${NC}"
    exit 1
else
    echo "${GREEN}✅ Docker est actif${NC}"
fi

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo "${YELLOW}⚠️  Node.js n'est pas installé${NC}"
    echo "${YELLOW}   → Installe via : https://nodejs.org ou 'brew install node'${NC}"
    echo "${YELLOW}   → Tu peux continuer, mais il te faudra Node pour dev local${NC}"
else
    echo "${GREEN}✅ Node.js installé :${NC} $(node --version)"
fi

# Vérifier Git
if ! command -v git &> /dev/null; then
    echo "${RED}❌ Git n'est pas installé${NC}"
    exit 1
else
    echo "${GREEN}✅ Git installé :${NC} $(git --version)"
fi

echo ""
echo "${GREEN}✅ Tous les prérequis sont OK !${NC}"
echo ""

# ============================================
# 2. CONFIGURATION GIT
# ============================================

echo "${BLUE}📧 Configuration Git...${NC}"
git config --global user.name "Patrick"
git config --global user.email "dankozobeats@gmail.com"
echo "${GREEN}✅ Git configuré${NC}"
echo ""

# ============================================
# 3. CRÉATION DE LA STRUCTURE
# ============================================

echo "${BLUE}📁 Création de la structure du projet...${NC}"

# Frontend
mkdir -p frontend/{src/{lib,routes,stores,api,utils},public,tests}

# Backend
mkdir -p backend/{src/{routes,controllers,services,models,middlewares,config,utils},tests,prisma}

# Docker
mkdir -p docker/{postgres,nginx,traefik}

# Scripts
mkdir -p scripts/{setup,deploy,backup,security}

# Docs
mkdir -p docs/{architecture,security,deployment,api}

# GitHub
mkdir -p .github/workflows

echo "${GREEN}✅ Structure créée${NC}"
echo ""

# ============================================
# 4. CRÉATION DES FICHIERS DE CONFIG
# ============================================

echo "${BLUE}📝 Création des fichiers de configuration...${NC}"

# .gitignore
cat > .gitignore << 'EOF'
node_modules/
.pnpm-store/
.env
.env.local
.env.*.local
dist/
build/
.DS_Store
.cursor/
*.log
*.sqlite
*.db
postgres-data/
pgdata/
docker-compose.override.yml
coverage/
tmp/
EOF

# .env.example
cat > .env.example << 'EOF'
# Database
DATABASE_URL=postgresql://habits_user:dev_password_2025@localhost:5432/habits_app
POSTGRES_DB=habits_app
POSTGRES_USER=habits_user
POSTGRES_PASSWORD=dev_password_2025

# Backend
NODE_ENV=development
PORT=3000
JWT_SECRET=dev_secret_change_in_prod
JWT_EXPIRES_IN=7d

# Frontend
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Habits Tracker V12

# Security
CORS_ORIGIN=http://localhost:5173
EOF

# Copier .env.example vers .env.development
cp .env.example .env.development

# README.md
cat > README.md << 'EOF'
# 🎯 Habits Tracker V12

Application de suivi d'habitudes avec architecture moderne et sécurisée.

## 🚀 Quick Start
```bash
# Démarrer l'environnement
./scripts/dev-start.sh

# Arrêter l'environnement
./scripts/dev-stop.sh

# Voir les logs
./scripts/dev-logs.sh
```

## 📍 Accès Local

- Frontend : http://localhost:5173
- Backend API : http://localhost:3000
- Database : localhost:5432

## 🛠️ Stack Technique

- Frontend: Svelte + Vite + TailwindCSS
- Backend: Express + Prisma
- Database: PostgreSQL 15
- Infra: Docker + Traefik

## 📂 Structure
```
├── frontend/          # Application Svelte
├── backend/           # API Express
├── docker/            # Configs Docker
├── scripts/           # Scripts utilitaires
└── docs/              # Documentation
```
EOF

echo "${GREEN}✅ Fichiers de config créés${NC}"
echo ""

# ============================================
# 5. DOCKER COMPOSE DEV
# ============================================

echo "${BLUE}🐳 Création du Docker Compose dev...${NC}"

cat > docker/docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: habits-db-dev
    environment:
      POSTGRES_DB: habits_app
      POSTGRES_USER: habits_user
      POSTGRES_PASSWORD: dev_password_2025
    ports:
      - "5432:5432"
    volumes:
      - postgres-data-dev:/var/lib/postgresql/data
    networks:
      - habits-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U habits_user -d habits_app"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile.dev
    container_name: habits-backend-dev
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://habits_user:dev_password_2025@postgres:5432/habits_app
      PORT: 3000
      JWT_SECRET: dev_secret_2025
    ports:
      - "3000:3000"
    volumes:
      - ../backend:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - habits-network
    restart: unless-stopped

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile.dev
    container_name: habits-frontend-dev
    environment:
      NODE_ENV: development
      VITE_API_URL: http://localhost:3000
    ports:
      - "5173:5173"
    volumes:
      - ../frontend:/app
      - /app/node_modules
    networks:
      - habits-network
    restart: unless-stopped

volumes:
  postgres-data-dev:

networks:
  habits-network:
    driver: bridge
EOF

echo "${GREEN}✅ Docker Compose créé${NC}"
echo ""

# ============================================
# 6. SCRIPTS UTILITAIRES
# ============================================

echo "${BLUE}⚙️  Création des scripts utilitaires...${NC}"

# Script de démarrage
cat > scripts/dev-start.sh << 'EOF'
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
EOF

# Script d'arrêt
cat > scripts/dev-stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Arrêt de l'environnement de développement..."
cd docker
docker-compose -f docker-compose.dev.yml down
echo "✅ Services arrêtés"
EOF

# Script de logs
cat > scripts/dev-logs.sh << 'EOF'
#!/bin/bash

cd docker
docker-compose -f docker-compose.dev.yml logs -f
EOF

# Script de restart
cat > scripts/dev-restart.sh << 'EOF'
#!/bin/bash

echo "🔄 Redémarrage de l'environnement..."
cd docker
docker-compose -f docker-compose.dev.yml restart
echo "✅ Services redémarrés"
EOF

# Script de clean
cat > scripts/dev-clean.sh << 'EOF'
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
EOF

# Rendre les scripts exécutables
chmod +x scripts/dev-*.sh

echo "${GREEN}✅ Scripts créés et rendus exécutables${NC}"
echo ""

# ============================================
# 7. DOCKERFILES DE DEV
# ============================================

echo "${BLUE}🐳 Création des Dockerfiles...${NC}"

# Backend Dockerfile.dev
cat > backend/Dockerfile.dev << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copier package.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code
COPY . .

# Port
EXPOSE 3000

# Mode dev avec nodemon
CMD ["npm", "run", "dev"]
EOF

# Frontend Dockerfile.dev
cat > frontend/Dockerfile.dev << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copier package.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code
COPY . .

# Port Vite
EXPOSE 5173

# Mode dev
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
EOF

# Package.json basiques
cat > backend/package.json << 'EOF'
{
  "name": "habits-backend",
  "version": "1.0.0",
  "description": "Backend API Habits Tracker",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
EOF

cat > frontend/package.json << 'EOF'
{
  "name": "habits-frontend",
  "version": "1.0.0",
  "description": "Frontend Habits Tracker",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "svelte": "^4.2.8"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^3.0.1",
    "vite": "^5.0.10"
  }
}
EOF

# Backend index.js basique
mkdir -p backend/src
cat > backend/src/index.js << 'EOF'
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Habits Tracker API V12',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend démarré sur le port ${PORT}`);
});
EOF

echo "${GREEN}✅ Dockerfiles et fichiers de base créés${NC}"
echo ""

# ============================================
# 8. INITIALISATION GIT
# ============================================

echo "${BLUE}📦 Initialisation Git...${NC}"

# Initialiser Git si pas déjà fait
if [ ! -d .git ]; then
    git init
    git branch -M main
    echo "${GREEN}✅ Git initialisé${NC}"
else
    echo "${YELLOW}⚠️  Git déjà initialisé${NC}"
fi

# Premier commit
git add .
git commit -m "🎉 Setup initial Habits Tracker V12 - Environnement dev complet" 2>/dev/null || echo "${YELLOW}⚠️  Commit déjà existant ou rien à commiter${NC}"

echo ""

# ============================================
# 9. RÉSUMÉ FINAL
# ============================================

echo ""
echo "${GREEN}========================================${NC}"
echo "${GREEN}✅ SETUP TERMINÉ AVEC SUCCÈS !${NC}"
echo "${GREEN}========================================${NC}"
echo ""
echo "${BLUE}📂 Structure créée :${NC}"
echo "   ├── frontend/     (Svelte app)"
echo "   ├── backend/      (Express API)"
echo "   ├── docker/       (Docker configs)"
echo "   ├── scripts/      (Utilitaires)"
echo "   └── docs/         (Documentation)"
echo ""
echo "${BLUE}🚀 Prochaines étapes :${NC}"
echo ""
echo "   1️⃣  Démarrer l'environnement :"
echo "      ${YELLOW}./scripts/dev-start.sh${NC}"
echo ""
echo "   2️⃣  Ouvrir dans Cursor :"
echo "      ${YELLOW}cursor .${NC}"
echo ""
echo "   3️⃣  Accéder aux services :"
echo "      Frontend : ${YELLOW}http://localhost:5173${NC}"
echo "      Backend  : ${YELLOW}http://localhost:3000${NC}"
echo ""
echo "${BLUE}📚 Commandes utiles :${NC}"
echo "   Logs      : ${YELLOW}./scripts/dev-logs.sh${NC}"
echo "   Arrêter   : ${YELLOW}./scripts/dev-stop.sh${NC}"
echo "   Redémarrer: ${YELLOW}./scripts/dev-restart.sh${NC}"
echo "   Nettoyer  : ${YELLOW}./scripts/dev-clean.sh${NC}"
echo ""
echo "${GREEN}Happy coding! 🎉${NC}"
echo ""
