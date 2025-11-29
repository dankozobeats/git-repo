# 🔔 Système de Rappels Web Push - Documentation Technique

## 📌 Vue d'ensemble
Ce système permet d'envoyer des notifications push aux utilisateurs pour leurs habitudes (habits), même lorsque l'application n'est pas ouverte. Il repose sur **Next.js**, **Supabase**, **Web Push (VAPID)** et un **Cron Job sur VPS**.

---

## 🏗 Architecture

1.  **Frontend (Next.js)** : L'utilisateur active les notifications via le Service Worker.
2.  **Database (Supabase)** : Stocke les abonnements Push (`push_subscriptions`) et les rappels (`reminders`).
3.  **Backend (API Routes)** :
    *   `/api/subscribe` : Enregistre l'abonnement.
    *   `/api/process-reminders` : Vérifie les rappels dus et envoie les notifications.
4.  **Automation (VPS Cron)** : Un script appelle `/api/process-reminders` toutes les minutes.

---

## 🗄 Base de Données (Supabase)

### Table `push_subscriptions`
Stocke les clés techniques pour envoyer des notifications à un navigateur spécifique.

| Colonne | Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `user_id` | uuid | FK vers `auth.users` |
| `endpoint` | text | URL unique du navigateur |
| `p256dh` | text | Clé de chiffrement publique |
| `auth` | text | Clé d'authentification |

### Table `reminders`
Définit quand envoyer un rappel.

| Colonne | Type | Description |
| :--- | :--- | :--- |
| `weekday` | int4 | Jour de la semaine (0=Dimanche, 6=Samedi) |
| `time_local` | text | Heure locale (ex: "09:00") |
| `active` | bool | Si le rappel est activé |
| `channel` | text | "push" (ou "email" futur) |

---

## 🔌 API Endpoints

### 1. `POST /api/subscribe`
Enregistre un nouvel appareil pour les notifications.
*   **Auth** : Session Supabase active requise.
*   **Body** : Objet `PushSubscription` standard.

### 2. `POST /api/process-reminders`
Cœur du système. Exécuté par le Cron.
*   **Auth** : Header `Authorization: Bearer CRON_SECRET`.
*   **Logique** :
    1.  Récupère l'heure actuelle (UTC/Server time -> ajusté selon logique app).
    2.  Cherche les `reminders` actifs pour ce jour/heure.
    3.  Pour chaque rappel, trouve les `push_subscriptions` du user.
    4.  Envoie la notif via `web-push`.
    5.  Supprime les abonnements invalides (410 Gone).

---

## 💻 Frontend & Intégration

### Composant `<PushEnableButton />`
Bouton prêt à l'emploi pour demander la permission.
*   Enregistre `sw.js`.
*   Convertit la clé VAPID.
*   Appelle `/api/subscribe`.

### Service Worker (`public/sw.js`)
Fichier minimaliste qui :
*   Écoute l'événement `push`.
*   Affiche la notification système.
*   Gère le clic (ouvre l'app).

---

## ⚙️ Configuration VPS & Cron

Le VPS sert uniquement d'horloge pour déclencher les rappels.

**Script** : `/usr/local/bin/trigger-reminders.sh`
```bash
curl -s -X POST https://votre-domaine.com/api/process-reminders \
     -H "Authorization: Bearer VOTRE_CRON_SECRET"
```

**Crontab** (Toutes les minutes) :
```bash
* * * * * /usr/local/bin/trigger-reminders.sh >> /var/log/reminders.log 2>&1
```

---

## 🔑 Variables d'Environnement

À configurer dans `.env.local` et sur Vercel :

```bash
# Clés VAPID (Générées avec web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BGlTT..."
VAPID_PRIVATE_KEY="xaqyg..."

# Sécurité Cron
CRON_SECRET="votre_secret_long_et_complexe"

# Supabase (Déjà configuré)
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```
