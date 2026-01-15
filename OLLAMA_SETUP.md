# Configuration Ollama pour Production (Vercel)

## Problème

En développement, Ollama fonctionne sur `http://localhost:11434`, mais en production (Vercel), cette URL ne fonctionne pas car :
1. Vercel est un environnement serverless sans accès à `localhost`
2. Ton serveur Ollama sur VPS n'est pas accessible depuis Vercel

## Solution : Exposer Ollama sur ton VPS

### Étape 1 : Configurer Ollama pour accepter les connexions externes

Sur ton VPS, modifie la configuration Ollama :

```bash
# SSH vers ton VPS
ssh user@ton-vps.com

# Arrête Ollama
sudo systemctl stop ollama

# Édite le service systemd
sudo nano /etc/systemd/system/ollama.service

# Ajoute cette ligne dans la section [Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"

# Exemple complet :
[Service]
Type=simple
ExecStart=/usr/local/bin/ollama serve
Environment="OLLAMA_HOST=0.0.0.0:11434"
Restart=always
RestartSec=3

# Recharge systemd et redémarre Ollama
sudo systemctl daemon-reload
sudo systemctl start ollama
sudo systemctl status ollama
```

### Étape 2 : Ouvrir le port dans le firewall

```bash
# Pour UFW (Ubuntu/Debian)
sudo ufw allow 11434/tcp
sudo ufw reload

# Pour firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=11434/tcp
sudo firewall-cmd --reload
```

### Étape 3 : Tester la connexion

Depuis ton ordinateur local :

```bash
curl http://TON_VPS_IP:11434/api/tags
```

Tu devrais voir la liste de tes modèles installés.

### Étape 4 : Configurer les variables d'environnement Vercel

Dans le dashboard Vercel → Settings → Environment Variables :

```env
OLLAMA_URL=http://TON_VPS_IP:11434
OLLAMA_MODEL=phi3:mini
```

**⚠️ IMPORTANT** : Remplace `TON_VPS_IP` par l'adresse IP réelle de ton VPS.

### Étape 5 : Redéployer sur Vercel

```bash
git add .
git commit -m "Update Ollama configuration for production"
git push
```

Vercel va automatiquement redéployer avec les nouvelles variables d'environnement.

---

## Option Alternative : Utiliser un Reverse Proxy avec HTTPS

Pour plus de sécurité, expose Ollama derrière Nginx avec HTTPS :

### 1. Installer Nginx sur le VPS

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

### 2. Créer une configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/ollama
```

Contenu :

```nginx
server {
    listen 80;
    server_name ollama.ton-domaine.com;

    location / {
        proxy_pass http://127.0.0.1:11434;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
    }
}
```

### 3. Activer la configuration

```bash
sudo ln -s /etc/nginx/sites-available/ollama /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Obtenir un certificat SSL

```bash
sudo certbot --nginx -d ollama.ton-domaine.com
```

### 5. Mettre à jour la variable Vercel

```env
OLLAMA_URL=https://ollama.ton-domaine.com
OLLAMA_MODEL=phi3:mini
```

---

## Option 3 : Utiliser Gemini en production (Fallback)

Si exposer Ollama est compliqué, utilise Gemini en production :

### 1. Obtenir une clé API Gemini

- Va sur [Google AI Studio](https://aistudio.google.com/app/apikey)
- Crée une clé API gratuite

### 2. Configurer dans Vercel

```env
GEMINI_API_KEY=ta_cle_api_ici
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_LANGUAGE=fr
```

Le code actuel (`fetchAI.ts`) donne déjà la priorité à Gemini si `GEMINI_API_KEY` est défini.

---

## Sécurité

### ⚠️ Si tu exposes Ollama directement (Option 1)

**Risques :**
- N'importe qui peut utiliser ton serveur Ollama
- Consommation de ressources non contrôlée

**Recommandations :**
1. Restreindre l'accès par IP (firewall)
2. Utiliser un token d'authentification custom
3. Monitorer l'usage

### ✅ Si tu utilises Nginx + HTTPS (Option 2)

**Avantages :**
- Chiffrement des communications
- Possibilité d'ajouter une authentification HTTP Basic
- Rate limiting via Nginx

**Exemple avec auth :**

```nginx
location / {
    auth_basic "Ollama API";
    auth_basic_user_file /etc/nginx/.htpasswd;

    proxy_pass http://127.0.0.1:11434;
    # ... reste de la config
}
```

Créer le fichier de mots de passe :

```bash
sudo apt install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
```

Puis modifier `fetchOllama` pour ajouter l'auth :

```typescript
const res = await fetch(`${OLLAMA_URL}/api/generate`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from('admin:ton_mot_de_passe').toString('base64')
  },
  body: JSON.stringify(body),
})
```

---

## Debugging en Production

### Vérifier les logs Vercel

Dans le dashboard Vercel → Deployments → [ton déploiement] → Functions

Cherche les erreurs liées à `fetchOllama`.

### Tester manuellement

```bash
# Depuis ton terminal local
curl -X POST http://TON_VPS_IP:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "phi3:mini",
    "prompt": "Hello",
    "stream": false
  }'
```

### Variables d'environnement manquantes

Si tu vois l'erreur "Aucune configuration IA disponible", vérifie que dans Vercel :
- Soit `GEMINI_API_KEY` est définie
- Soit `OLLAMA_URL` est définie

---

## Recommandation Finale

**Pour la production**, je recommande l'**Option 2** (Nginx + HTTPS) pour :
- ✅ Sécurité (HTTPS + auth optionnelle)
- ✅ Fiabilité (Nginx gère les timeouts/retry)
- ✅ Monitoring (logs Nginx)
- ✅ Gratuit (pas de coût API comme Gemini)

**Pour le développement local**, garde `http://localhost:11434`.

Utilise un fichier `.env.local` (dev) et les variables Vercel (prod) :

```env
# .env.local (dev - git ignored)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=phi3:mini

# Vercel Environment Variables (prod)
OLLAMA_URL=https://ollama.ton-domaine.com
OLLAMA_MODEL=phi3:mini
```
