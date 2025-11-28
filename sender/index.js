import 'dotenv/config'
import fetch from 'node-fetch'

const CRON_SECRET = process.env.CRON_SECRET
const DISPATCH_URL = process.env.DISPATCH_URL || 'http://localhost:3000/api/reminders/dispatch'

if (!CRON_SECRET) {
  console.error('CRON_SECRET manquant')
  process.exit(1)
}

async function run() {
  try {
    const res = await fetch(DISPATCH_URL, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${CRON_SECRET}` },
    })
    const json = await res.json()
    if (!res.ok) {
      console.error('Dispatch error:', json)
      process.exit(2)
    }
    console.log(`[sender] sent=${json.sent} due=${json.due} checked=${json.checked}`)
  } catch (e) {
    console.error('Sender failed:', e)
    process.exit(3)
  }
}

await run()
