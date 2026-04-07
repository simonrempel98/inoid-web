'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/assets' ? pathname.startsWith('/assets') : pathname === href

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      backgroundColor: 'white',
      borderTop: '1px solid #c8d4e8',
      display: 'flex', alignItems: 'flex-end',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 50,
    }}>

      {/* Assets */}
      <NavItem href="/assets" label="Assets" active={isActive('/assets')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={isActive('/assets') ? '#003366' : '#96aed2'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect x="8" y="2" width="8" height="4" rx="1"/>
          <line x1="9" y1="12" x2="15" y2="12"/>
          <line x1="9" y1="16" x2="15" y2="16"/>
        </svg>
      </NavItem>

      {/* ── SCAN (Mitte, groß) ── */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
        <Link href="/scan" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: isActive('/scan')
              ? 'linear-gradient(135deg, #003366, #0099cc)'
              : 'linear-gradient(135deg, #003366, #0099cc)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,51,102,0.35)',
            marginTop: -20,
            border: '3px solid white',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
              <rect x="7" y="7" width="10" height="10" rx="1"/>
            </svg>
          </div>
          <span style={{
            fontSize: 10, fontFamily: 'Arial, sans-serif', fontWeight: 700,
            color: '#003366',
          }}>Scannen</span>
        </Link>
      </div>

      {/* Wartung */}
      <NavItem href="/wartung" label="Wartung" active={isActive('/wartung')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={isActive('/wartung') ? '#003366' : '#96aed2'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </NavItem>

      {/* Mehr */}
      <NavItem href="/mehr" label="Mehr" active={isActive('/mehr')}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={isActive('/mehr') ? '#003366' : '#96aed2'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      </NavItem>

    </nav>
  )
}

function NavItem({ href, label, active, children }: {
  href: string
  label: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link href={href} style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '10px 0 8px',
      textDecoration: 'none', gap: 3,
    }}>
      {children}
      <span style={{
        fontSize: 10, fontFamily: 'Arial, sans-serif',
        fontWeight: active ? 700 : 400,
        color: active ? '#003366' : '#96aed2',
      }}>
        {label}
      </span>
      {active && (
        <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#003366' }} />
      )}
    </Link>
  )
}
