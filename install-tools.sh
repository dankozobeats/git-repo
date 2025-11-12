#!/bin/bash

echo "🚀 Installation des outils de développement..."
echo ""

# Vérifier si Homebrew est installé
if ! command -v brew &> /dev/null; then
    echo "📦 Installation de Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Ajouter Homebrew au PATH
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    echo "✅ Homebrew déjà installé"
fi

echo ""
echo "📦 Installation des outils essentiels..."

# Tree (pour visualiser l'arborescence)
brew install tree

# Node.js (si pas installé)
if ! command -v node &> /dev/null; then
    brew install node
fi

# Git (normalement déjà installé)
if ! command -v git &> /dev/null; then
    brew install git
fi

# Docker Desktop (si pas installé)
if ! command -v docker &> /dev/null; then
    echo "📦 Téléchargement de Docker Desktop..."
    brew install --cask docker
    echo "⚠️  Pense à lancer Docker Desktop depuis Applications !"
fi

# Outils utiles
brew install wget curl jq

echo ""
echo "✅ Installation terminée !"
echo ""
echo "Outils installés :"
echo "  - Homebrew (gestionnaire de paquets)"
echo "  - Tree (visualiser dossiers)"
echo "  - Node.js (JavaScript runtime)"
echo "  - Git (versionning)"
echo "  - Docker (conteneurs)"
echo "  - wget, curl, jq (utilitaires)"
echo ""
echo "⚠️  Redémarre ton terminal pour appliquer les changements"
