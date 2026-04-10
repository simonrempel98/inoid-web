'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function AdminLogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title="Abmelden"
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 6,
        border: '1px solid var(--adm-border2)',
        background: 'transparent',
        color: 'var(--adm-text3)',
        fontSize: 12, fontWeight: 600,
        cursor: loading ? 'default' : 'pointer',
        fontFamily: 'Arial, sans-serif',
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? '…' : '⏻ Abmelden'}
    </button>
  )
}
