import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rzltanitzmcoimrqtudg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bHRhbml0em1jb2ltcnF0dWRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMDkyODksImV4cCI6MjEwNjY4NTI4OX0.qoxW72Zqt1eoN9Z3YqGs-0ubr3ZA-DIS098VqFazzP8'

async function checkProfiles() {
  const client1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: auth1 } = await client1.auth.signInWithPassword({
    email: 'villarosaadrian1A@gmail.com',
    password: 'password123',
  })
  console.log('Logged in User1 id:', auth1?.user?.id)

  const { data: allProfiles, error } = await client1.from('profiles').select('*')
  console.log('Error fetching profiles:', error)
  console.log('Total profiles in DB:', allProfiles?.length)
  if (allProfiles) {
    for (const p of allProfiles) {
      console.log(`- ${p.display_name} (${p.id}) city=${p.city} country=${p.country} visible=${p.openworld_visible}`)
    }
  }

  // Check connections
  const { data: conns } = await client1.from('connections').select('*')
  console.log('Total connections in DB:', conns)
}

checkProfiles().catch(console.error)
