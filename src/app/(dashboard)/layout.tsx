import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BottomNav } from '@/components/nav-bottom'
import { Sidebar } from '@/components/nav-sidebar'
import { DashboardThemeProvider } from '@/components/dashboard-theme-provider'
import { DashboardThemeToggle } from '@/components/dashboard-theme-toggle'
import { NativeAppInit } from '@/components/native-app-init'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, organization_id, avatar_url')
    .eq('id', user.id)
    .single()

  // Org-Features laden (z.B. serviceheft, wartung)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let features: Record<string, boolean> = {}
  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('features')
      .eq('id', profile.organization_id)
      .single()
    features = ((org as any)?.features as Record<string, boolean>) ?? {}
  }

  return (
    <DashboardThemeProvider>
      <NativeAppInit />
      {/* Desktop Sidebar – nur auf md+ sichtbar (via CSS class) */}
      <div className="hidden md:block">
        <Sidebar
          userEmail={user.email!}
          userName={profile?.full_name ?? undefined}
          avatarUrl={(profile as any)?.avatar_url ?? undefined}
          features={features}
        />
      </div>

      {/* Mobile Header */}
      <header className="md:hidden" style={{
        position: 'sticky', top: 0, zIndex: 40,
        backgroundColor: 'var(--ds-nav-bg)',
        borderBottom: '1px solid var(--ds-nav-border)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/dashboard" style={{ display: 'flex' }}>
          <Image src="/Inometa_INOid_21x13mm.png" alt="INOid" width={70} height={43} style={{ objectFit: 'contain' }} />
        </Link>
        <DashboardThemeToggle style={{ background: 'var(--ds-surface2)', border: '1px solid var(--ds-border)', color: 'var(--ds-text3)' }} />
      </header>

      {/* Main Content */}
      <main className="md:ml-[230px]" style={{ paddingBottom: 80 }}>
        {children}
      </main>

      {/* Bottom Nav – nur Mobile */}
      <div className="md:hidden">
        <BottomNav
          features={features}
          userEmail={user.email ?? undefined}
          userName={profile?.full_name ?? undefined}
          avatarUrl={(profile as any)?.avatar_url ?? undefined}
        />
      </div>
    </DashboardThemeProvider>
  )
}
