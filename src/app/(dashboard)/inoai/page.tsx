// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { INOaiChat } from './chat-client'

export default async function INOaiPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('organization_id').eq('id', user.id).single()
  if (!profile?.organization_id) redirect('/dashboard')

  const { data: org } = await supabase
    .from('organizations')
    .select('features')
    .eq('id', profile.organization_id)
    .single()

  const features = (org?.features as Record<string, boolean>) ?? {}
  if (features.inoai === false) redirect('/dashboard')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid #e8edf4',
        background: 'white', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, #003366 0%, #0099cc 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2z"/>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
            <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3"/>
            <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3"/>
          </svg>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#003366', fontFamily: 'Arial, sans-serif' }}>
            INOai
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
            Produktassistent · powered by INOMETA-Wissensbasis
          </p>
        </div>
      </div>

      <INOaiChat />
    </div>
  )
}
