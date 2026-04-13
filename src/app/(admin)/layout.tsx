import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { AdminThemeProvider } from '@/components/admin-theme-provider'
import { AdminThemeToggle } from '@/components/admin-theme-toggle'
import { AdminLogoutButton } from '@/components/admin-logout-button'

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
    <AdminThemeProvider>
      {/* Admin Top Bar */}
      <div className="adm-topbar" style={{
        background: 'var(--adm-surface)',
        borderBottom: '1px solid var(--adm-border)',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Left: Logo + Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Image
              src="/Inometa_INOid_21x13mm.png"
              alt="INOid"
              width={72}
              height={44}
              className="adm-logo-img"
              style={{ objectFit: 'contain', display: 'block' }}
            />
            <div style={{
              display: 'flex', alignItems: 'center',
              borderLeft: '1px solid var(--adm-border)', paddingLeft: 10, gap: 6,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.14em',
                color: 'var(--adm-text3)', textTransform: 'uppercase',
              }}>Admin</span>
            </div>
          </div>

          <div className="adm-nav-scroll">
            <nav style={{ display: 'flex', gap: 2, whiteSpace: 'nowrap' }}>
              {[
                { href: '/admin', label: 'Dashboard' },
                { href: '/admin/orgs', label: 'Organisationen' },
                { href: '/admin/team', label: 'Team' },
                { href: '/admin/system', label: 'System' },
                { href: '/admin/sensors', label: 'Sensoren' },
                { href: '/admin/inoai', label: 'INOai' },
                { href: '/admin/roadmap', label: 'Roadmap' },
                { href: '/admin/techstack', label: 'Docs' },
              ].map(item => (
                <a key={item.href} href={item.href} style={{
                  padding: '6px 12px', borderRadius: 8,
                  color: 'var(--adm-text2)', fontSize: 13, fontWeight: 600,
                  textDecoration: 'none',
                }}>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span className="adm-hide-mobile" style={{ fontSize: 12, color: 'var(--adm-text3)' }}>
            {profile.email}
          </span>
          <AdminThemeToggle />
          <a href="/dashboard" style={{
            fontSize: 12, color: '#0099cc', textDecoration: 'none', fontWeight: 600,
            padding: '5px 10px', border: '1px solid #0099cc', borderRadius: 6,
            whiteSpace: 'nowrap',
          }}>
            → App
          </a>
          <AdminLogoutButton />
        </div>
      </div>

      {/* Content */}
      <div className="adm-content" style={{ padding: '24px' }}>
        {children}
      </div>
    </AdminThemeProvider>
  )
}
