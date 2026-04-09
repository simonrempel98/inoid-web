import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { BottomNav } from '@/components/nav-bottom'
import { Sidebar } from '@/components/nav-sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') ?? '/dashboard'
    redirect(`/login?redirectTo=${encodeURIComponent(pathname)}`)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f9', fontFamily: 'Arial, sans-serif' }}>

      {/* Desktop Sidebar – nur auf md+ sichtbar (via CSS class) */}
      <div className="hidden md:block">
        <Sidebar userEmail={user.email!} userName={profile?.full_name ?? undefined} />
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
        <BottomNav />
      </div>

    </div>
  )
}
