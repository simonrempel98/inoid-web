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
    <>
      {/*
        Desktop: sidebar 230px links, kein mobile header → volle dvh
        Mobile:  sticky header ~63px oben, bottom nav 56px unten (fixed)
                 → calc(100dvh - 63px) mit padding-bottom 56px im Input
      */}
      <style>{`
        .inoai-page-wrap {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          overflow: hidden;
        }
        @media (max-width: 767px) {
          .inoai-page-wrap {
            height: calc(100dvh - 63px);
          }
        }
      `}</style>

      <div className="inoai-page-wrap">
        {/* Page-Header */}
        <div style={{
          padding: '12px 18px',
          borderBottom: '1px solid #e8edf4',
          background: 'white',
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #003366 0%, #0099cc 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#003366', fontFamily: 'Arial, sans-serif' }}>
              INOai
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
              Produktassistent · INOMETA-Wissensbasis
            </p>
          </div>
        </div>

        <INOaiChat />
      </div>
    </>
  )
}
