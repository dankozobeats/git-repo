# Guide de Déploiement VPS (51.83.32.24)

Ce guide est spécifique à votre infrastructure.

## 1. Préparation du VPS (Une seule fois)

Si votre VPS est vierge, connectez-vous et installez les pré-requis.
J'ai créé un script `setup_vps.sh` pour automatiser cela.

1.  Copiez le script sur le VPS :
    ```bash
    scp setup_vps.sh debian@51.83.32.24:~/
    ```
2.  Connectez-vous et lancez-le :
    ```bash
    ssh debian@51.83.32.24
    chmod +x setup_vps.sh
    ./setup_vps.sh
    ```

## 2. Configuration des Secrets

Vous devez créer les fichiers `.env` sur le serveur car ils ne sont pas (et ne doivent pas être) dans le dépôt git.

1.  Connectez-vous : `ssh debian@51.83.32.24`
2.  Créez le dossier : `mkdir -p ~/badhabit-tracker/sender`
3.  Créez `.env.local` pour l'app :
    ```bash
    nano ~/badhabit-tracker/.env.local
    ```
    *Collez le contenu de votre `.env.local` local (Supabase keys, VAPID public key, etc.).*

4.  Créez `.env` pour le sender :
    ```bash
    nano ~/badhabit-tracker/sender/.env
    ```
    *Collez :*
    ```env
    CRON_SECRET=votre_secret
    DISPATCH_URL=http://localhost:3000/api/reminders/dispatch
    ```

## 3. Déploiement Automatique

Depuis votre Mac, lancez simplement le script de déploiement :

```bash
chmod +x deploy.sh
./deploy.sh
```

Ce script va :
1.  Synchroniser vos fichiers vers le VPS.
2.  Installer les dépendances sur le VPS.
3.  Builder l'application Next.js.
4.  Démarrer/Redémarrer l'application et le sender avec PM2.

## 4. Configuration Nginx (Reverse Proxy)

Pour accéder à votre site via l'IP (port 80) au lieu du port 3000 :

1.  Sur le VPS, créez la config :
    ```bash
    sudo nano /etc/nginx/sites-available/badhabit
    ```
2.  Collez ceci :
    ```nginx
    server {
        listen 80;
        server_name 51.83.32.24; # Ou votre domaine

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
3.  Activez le site :
    ```bash
    sudo ln -s /etc/nginx/sites-available/badhabit /etc/nginx/sites-enabled/
    sudo rm /etc/nginx/sites-enabled/default
    sudo systemctl restart nginx
    ```

## 5. Vérification

Accédez à `http://51.83.32.24`. Votre application devrait être en ligne !
