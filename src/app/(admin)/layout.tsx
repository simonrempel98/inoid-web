import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile?.is_platform_admin) redirect('/dashboard')

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', fontFamily: 'Arial, sans-serif' }}>
      {/* Admin Top Bar */}
      <div style={{
        background: '#111827',
        borderBottom: '1px solid #1f2937',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: 'white', letterSpacing: 1 }}>
            INO<span style={{ color: '#0099cc' }}>id</span>
            <span style={{
              marginLeft: 8, fontSize: 10, fontWeight: 700,
              background: '#dc2626', color: 'white',
              padding: '2px 7px', borderRadius: 4, letterSpacing: '0.1em',
              verticalAlign: 'middle',
            }}>ADMIN</span>
          </div>

          <nav style={{ display: 'flex', gap: 4 }}>
            {[
              { href: '/admin', label: 'Dashboard' },
              { href: '/admin/orgs', label: 'Organisationen' },
              { href: '/admin/users', label: 'Nutzer' },
              { href: '/admin/system', label: 'System' },
            ].map(item => (
              <a key={item.href} href={item.href} style={{
                padding: '6px 14px', borderRadius: 8,
                color: '#9ca3af', fontSize: 13, fontWeight: 600,
                textDecoration: 'none',
              }}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            {profile.email}
          </span>
          <a href="/dashboard" style={{
            fontSize: 12, color: '#0099cc', textDecoration: 'none', fontWeight: 600,
            padding: '5px 12px', border: '1px solid #0099cc', borderRadius: 6,
          }}>
            → App
          </a>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {children}
      </div>
    </div>
  )
}
