// Script temporaire pour vérifier les événements en base
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkEvents() {
  const habitId = '7b883981-1fbc-4ab8-a7c4-f8929f20c680'
  const today = new Date().toISOString().split('T')[0]

  console.log('Checking events for habit:', habitId)
  console.log('Today:', today)

  const { data: events, error } = await supabase
    .from('habit_events')
    .select('*')
    .eq('habit_id', habitId)
    .eq('event_date', today)
    .order('occurred_at', { ascending: true })

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log('\nTotal events today:', events?.length || 0)
  console.log('\nEvents detail:')
  events?.forEach((e, i) => {
    console.log(`${i + 1}. ID: ${e.id}`)
    console.log(`   Event date: ${e.event_date}`)
    console.log(`   Occurred at: ${e.occurred_at}`)
  })

  // Check habit tracking mode
  const { data: habit } = await supabase
    .from('habits')
    .select('name, tracking_mode')
    .eq('id', habitId)
    .single()

  console.log('\nHabit info:')
  console.log('Name:', habit?.name)
  console.log('Tracking mode:', habit?.tracking_mode)
}

checkEvents().then(() => process.exit(0))
