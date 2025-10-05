import { createClient } from '@/lib/supabase/server' // Corrected path
import { cookies } from 'next/headers'

export default async function TestPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // Fetch data from the 'profiles' table which exists in our schema
  const { data: profiles, error } = await supabase.from('profiles').select()

  if (error) {
    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>Error Fetching Profiles</h1>
            <p>There was an error fetching data from the database. Please check the console.</p>
            <pre style={{ background: '#f4f4f4', padding: '10px', borderRadius: '5px', color: 'red' }}>
                {error.message}
            </pre>
        </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Profiles Test</h1>
      <p>This page fetches and displays all profiles from the database. If you see data below, the connection is working.</p>
      <pre style={{ background: '#f4f4f4', padding: '10px', borderRadius: '5px' }}>
        {JSON.stringify(profiles, null, 2)}
      </pre>
    </div>
  )
}
