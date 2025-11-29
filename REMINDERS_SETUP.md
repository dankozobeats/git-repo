# Guide de Déploiement du Système de Rappel (VPS)

Ce guide explique comment configurer et déployer le système de rappel (notifications Push) sur votre VPS.

## 1. Pré-requis

- Accès SSH à votre VPS.
- Node.js installé sur le VPS (version 18+ recommandée).
- Le projet `badhabit-tracker` déployé ou accessible sur le VPS.

## 2. Génération des Clés VAPID

Les notifications Web Push nécessitent une paire de clés VAPID (publique et privée).

1.  **En local**, dans le dossier `sender` :
    ```bash
    cd sender
    npm install
    npm run generate:vapid
    ```
2.  Notez les clés générées :
    - `Public Key`
    - `Private Key`

## 3. Configuration des Variables d'Environnement

### Sur le serveur Next.js (VPS)
Ajoutez ces variables dans votre fichier `.env.local` (ou dans la config de déploiement) :

```env
# Pour l'API de rappel
CRON_SECRET=votre_secret_tres_long_et_securise
NEXT_PUBLIC_VAPID_PUBLIC_KEY=votre_cle_publique_vapid
VAPID_PRIVATE_KEY=votre_cle_privee_vapid
VAPID_SUBJECT=mailto:votre_email@example.com
```

### Pour le script Sender (VPS)
Le script `sender` est un processus Node.js indépendant qui doit tourner périodiquement. Il a besoin de connaître l'URL de votre API et le secret.

Créez un fichier `.env` dans le dossier `sender` sur le VPS :

```env
CRON_SECRET=votre_secret_tres_long_et_securise
DISPATCH_URL=https://votre-domaine.com/api/reminders/dispatch
```

> **Important :** Le `CRON_SECRET` doit être identique des deux côtés.

## 4. Installation du Script Sender sur le VPS

1.  Copiez le dossier `sender` sur votre VPS (par exemple dans `/var/www/badhabit-sender` ou à côté de votre app).
2.  Installez les dépendances :
    ```bash
    cd /chemin/vers/sender
    npm install --production
    ```

## 5. Configuration du CRON Job

Pour vérifier les rappels toutes les 15 minutes (ou à la fréquence souhaitée) :

1.  Ouvrez l'éditeur crontab :
    ```bash
    crontab -e
    ```
2.  Ajoutez la ligne suivante :
    ```cron
    */15 * * * * cd /chemin/vers/sender && node index.js >> /var/log/badhabit-sender.log 2>&1
    ```
    *Ajustez les chemins selon votre installation.*

## 6. Vérification

1.  Assurez-vous que votre application Next.js tourne.
2.  Lancez le script manuellement une fois pour tester :
    ```bash
    cd /chemin/vers/sender
    node index.js
    ```
3.  Vous devriez voir une sortie JSON indiquant le nombre de rappels envoyés (`sent`), dus (`due`) et vérifiés (`checked`).

## Dépannage

- **Erreur 401 Unauthorized** : Vérifiez que `CRON_SECRET` est identique dans le `.env` du sender et le `.env.local` de l'app Next.js.
- **Erreur Push** : Vérifiez que les clés VAPID sont correctes et que l'utilisateur a bien accepté les notifications (ce qui crée une entrée dans `push_subscriptions`).
