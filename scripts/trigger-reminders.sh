#!/bin/bash

# /usr/local/bin/trigger-reminders.sh

API_URL="https://my-badhabit-tracker.vercel.app/api/process-reminders"
CRON_SECRET="ed8eec4ad5abc2551d4a341c7dd41a066d3db99e9ad3c81907fcd1a1187e1d7d"

echo "Triggering reminders at $(date)..."

curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Accept: application/json"

echo ""
echo "Done."
