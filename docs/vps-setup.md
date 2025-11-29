# VPS Setup & Verification Guide

## 1. Verify Environment

Run these commands on your VPS to ensure everything is ready:

```bash
# Check Node.js version (should be >= 18)
node -v

# Check PM2 installation
pm2 -v

# Check Nginx status
sudo systemctl status nginx

# Check Certbot (SSL)
sudo certbot certificates
```

## 2. Install Cron Script

1.  Copy `scripts/trigger-reminders.sh` to your VPS (e.g., `/usr/local/bin/`).
2.  Make it executable:
    ```bash
    chmod +x /usr/local/bin/trigger-reminders.sh
    ```

## 3. Configure Crontab

Edit your crontab:
```bash
crontab -e
```

Add the following line to run every minute:
```bash
* * * * * /usr/local/bin/trigger-reminders.sh >> /var/log/reminders.log 2>&1
```

## 4. Environment Variables

Ensure your VPS environment (or the `.env` file used by PM2 if running the app there, though this guide assumes Vercel deployment and VPS only for Cron) has the necessary secrets if you were running the app there. Since the app is on Vercel/Next.js, the VPS only needs the `CRON_SECRET` inside the script (which is hardcoded in the script for simplicity, or can be an env var).

**Note:** The `trigger-reminders.sh` script currently has the `CRON_SECRET` hardcoded. For better security, you can move it to an environment variable.
