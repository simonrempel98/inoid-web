'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button onClick={handleLogout} style={{
      background: 'none', border: 'none',
      color: '#96aed2', fontSize: 12, cursor: 'pointer',
      padding: 0, fontFamily: 'Arial, sans-serif',
    }}>
      Abmelden
    </button>
  )
}
