# Vérifications et Tests

## 1. Vérifications VPS (SSH sur 51.83.32.24)

```bash
# Vérifier Node.js
node -v  # Doit être >= v18

# Vérifier PM2
pm2 status

# Vérifier Nginx
sudo systemctl status nginx

# Vérifier que le script est exécutable
ls -l /usr/local/bin/trigger-reminders.sh
# Si besoin : chmod +x /usr/local/bin/trigger-reminders.sh

# Vérifier les logs Cron (si configuré)
grep CRON /var/log/syslog
```

## 2. Configuration Crontab

Ajouter ceci via `crontab -e` :

```bash
* * * * * /usr/local/bin/trigger-reminders.sh >> /var/log/reminders.log 2>&1
```

## 3. Tests CURL (Depuis votre machine ou VPS)

### Test /api/subscribe (Simulation)
```bash
curl -X POST https://my-badhabit-tracker.vercel.app/api/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://fcm.googleapis.com/fcm/send/fake-endpoint",
    "keys": {
      "p256dh": "fake-key",
      "auth": "fake-auth"
    }
  }'
# Note: Cela retournera 401 Unauthorized si vous n'êtes pas connecté (cookie session requis).
# Pour tester réellement, utilisez le bouton dans l'interface.
```

### Test /api/process-reminders (Le plus important)
```bash
curl -X POST https://my-badhabit-tracker.vercel.app/api/process-reminders \
  -H "Authorization: Bearer ed8eec4ad5abc2551d4a341c7dd41a066d3db99e9ad3c81907fcd1a1187e1d7d" \
  -H "Accept: application/json"
```
Réponse attendue : `{"sent": 0}` (ou X si des rappels sont dus).

### Test /api/get-due-reminders (Debug)
```bash
curl https://my-badhabit-tracker.vercel.app/api/get-due-reminders
```
Réponse attendue : JSON avec `weekday`, `time_local` et liste `reminders`.
