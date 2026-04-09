import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BottomNav } from '@/components/nav-bottom'
import { Sidebar } from '@/components/nav-sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, organization_id')
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'Arial, sans-serif' }}>

      {/* Desktop Sidebar – nur auf md+ sichtbar (via CSS class) */}
      <div className="hidden md:block">
        <Sidebar
          userEmail={user.email!}
          userName={profile?.full_name ?? undefined}
          features={features}
        />
      </div>

      {/* Mobile Header */}
      <header className="md:hidden" style={{
        position: 'sticky', top: 0, zIndex: 40,
        backgroundColor: 'white',
        borderBottom: '1px solid #c8d4e8',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/dashboard" style={{ display: 'flex' }}>
          <Image src="/Inometa_INOid_21x13mm.png" alt="INOid" width={70} height={43} style={{ objectFit: 'contain' }} />
        </Link>
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
        />
      </div>

    </div>
  )
}
