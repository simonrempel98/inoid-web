import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AddTeamMemberForm } from './add-member-form'
import { RevokeButton } from './revoke-button'

export default async function AdminTeamPage() {
  // Dreifache Absicherung: neben proxy.ts + admin layout nochmals prüfen
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: selfProfile } = await supabase
    .from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!selfProfile?.is_platform_admin) redirect('/dashboard')

  const admin = createAdminClient()

  const { data: teamMembers } = await admin
    .from('profiles')
    .select('id, email, full_name, is_active, last_seen_at, created_at, must_change_password')
    .eq('is_platform_admin', true)
    .order('created_at')

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: '0 0 4px' }}>Platform-Team</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>
            Nutzer mit vollem Platform-Admin-Zugang — nur hier sichtbar und verwaltbar
          </p>
        </div>
        <AddTeamMemberForm />
      </div>

      {/* Security-Hinweis */}
      <div style={{
        background: '#0c1a2e', border: '1px solid #1e3a5f',
        borderRadius: 12, padding: '14px 18px', marginBottom: 24,
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: 1 }}>
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#93c5fd' }}>
            Geschützter Bereich
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
            Dieser Bereich ist dreifach gesichert. Kein Tenant-Nutzer kann ihn sehen oder erreichen,
            egal welche Rolle er innerhalb seiner Organisation hat.
            Nutzer hier haben Zugang zum gesamten Admin-Panel und zu allen Organisationen.
          </p>
        </div>
      </div>

      {/* Team-Tabelle */}
      <div style={{ background: '#111827', borderRadius: 14, border: '1px solid #1f2937', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr', padding: '10px 20px', borderBottom: '1px solid #1f2937' }}>
          {['Mitglied', 'Zuletzt aktiv', 'Status', 'Aktion'].map(h => (
            <p key={h} style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</p>
          ))}
        </div>

        {(teamMembers ?? []).map(m => (
          <div key={m.id} style={{
            display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr',
            padding: '14px 20px', borderBottom: '1px solid #1f2937',
            alignItems: 'center',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'white' }}>
                {m.full_name ?? m.email}
                {m.id === user.id && (
                  <span style={{
                    marginLeft: 8, fontSize: 10, fontWeight: 700,
                    background: '#0099cc', color: 'white',
                    padding: '2px 8px', borderRadius: 20,
                  }}>Du</span>
                )}
              </p>
              {m.full_name && <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{m.email}</p>}
              {m.must_change_password && (
                <span style={{ fontSize: 10, background: '#451a03', color: '#f59e0b', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                  PW ausstehend
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
              {m.last_seen_at ? new Date(m.last_seen_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '–'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: m.is_active !== false ? '#34d399' : '#6b7280',
              }} />
              <span style={{ fontSize: 12, color: m.is_active !== false ? '#34d399' : '#6b7280' }}>
                {m.is_active !== false ? 'aktiv' : 'gesperrt'}
              </span>
            </div>
            <RevokeButton userId={m.id} userName={m.full_name ?? m.email} isSelf={m.id === user.id} />
          </div>
        ))}

        {(teamMembers ?? []).length === 0 && (
          <p style={{ padding: '40px', color: '#6b7280', fontSize: 14, textAlign: 'center', margin: 0 }}>
            Keine Platform-Admins gefunden
          </p>
        )}
      </div>

      <p style={{ marginTop: 16, fontSize: 12, color: '#374151' }}>
        Tipp: Nach dem Entziehen des Zugangs hat der Nutzer noch eine aktive Session bis zum nächsten Login.
        Um sofort zu sperren, den Nutzer zusätzlich über die Nutzerverwaltung deaktivieren.
      </p>
    </div>
  )
}
