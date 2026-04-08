'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LogoutButton } from './logout-button'

export function Sidebar({ userEmail, userName }: { userEmail: string; userName?: string }) {
  const pathname = usePathname()
  const t = useTranslations()

  const SECTIONS = [
    {
      items: [
        {
          href: '/dashboard',
          label: t('nav.dashboard'),
          icon: (active: boolean) => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={active ? 'white' : '#96aed2'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          ),
        },
        {
          href: '/assets',
          label: t('nav.assets'),
          icon: (active: boolean) => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={active ? 'white' : '#96aed2'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1"/>
              <line x1="9" y1="12" x2="15" y2="12"/>
              <line x1="9" y1="16" x2="15" y2="16"/>
            </svg>
          ),
        },
        {
          href: '/scan',
          label: t('nav.scan'),
          icon: (active: boolean) => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={active ? 'white' : '#96aed2'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
              <rect x="7" y="7" width="10" height="10" rx="1"/>
            </svg>
          ),
        },
        {
          href: '/wartung',
          label: t('nav.wartung'),
          icon: (active: boolean) => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={active ? 'white' : '#96aed2'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          ),
        },
      ],
    },
    {
      label: t('nav.orgManagement'),
      items: [
        {
          href: '/organisation',
          label: t('nav.organisation'),
          icon: (active: boolean) => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={active ? 'white' : '#96aed2'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          ),
        },
        {
          href: '/teams',
          label: t('nav.teams'),
          icon: (active: boolean) => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={active ? 'white' : '#96aed2'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          ),
          children: [
            {
              href: '/settings/roles',
              label: t('nav.roles'),
              icon: (active: boolean) => (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={active ? 'white' : '#96aed2'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              ),
            },
          ],
        },
        // Billing ausgeblendet – wird durch Admin-Modul verwaltet
      ],
    },
    {
      label: t('nav.account'),
      items: [
        {
          href: '/mehr',
          label: t('nav.profile'),
          icon: (active: boolean) => (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke={active ? 'white' : '#96aed2'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          ),
        },
      ],
    },
  ]

  const isActive = (href: string) => {
    if (href === '/assets') return pathname === '/assets' || pathname.startsWith('/assets/')
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const isChildActive = (href: string) => pathname.startsWith(href)

  const assetsOpen = pathname.startsWith('/assets')
  const teamsOpen = pathname.startsWith('/teams') || pathname.startsWith('/settings/roles')

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: 230,
      backgroundColor: '#003366',
      display: 'flex', flexDirection: 'column',
      zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(150,174,210,0.2)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
      }}>
        <Link href="/dashboard" style={{ display: 'flex' }}>
          <Image src="/Inometa_INOid_21x13mm.png" alt="INOid" width={120} height={74}
            style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {SECTIONS.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                color: '#96aed2', padding: '28px 20px 6px',
                fontFamily: 'Arial, sans-serif', textTransform: 'uppercase',
              }}>
                {section.label}
              </p>
            )}
            {section.items.map(item => {
              const active = isActive(item.href)
              const hasChildren = 'children' in item && item.children && item.children.length > 0
              const showChildren = hasChildren && (
                (item.href === '/assets' && assetsOpen) ||
                (item.href === '/teams' && teamsOpen)
              )

              return (
                <div key={item.href}>
                  <Link href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 20px',
                    backgroundColor: active && !showChildren ? 'rgba(0,153,204,0.25)' : showChildren ? 'rgba(0,153,204,0.12)' : 'transparent',
                    borderLeft: active || showChildren ? '3px solid #0099cc' : '3px solid transparent',
                    color: active || showChildren ? 'white' : '#c8d4e8',
                    textDecoration: 'none', fontSize: 14,
                    fontFamily: 'Arial, sans-serif',
                    transition: 'background 0.15s',
                  }}>
                    {item.icon(active || showChildren)}
                    {item.label}
                  </Link>

                  {/* Sub-Items */}
                  {showChildren && hasChildren && (
                    <div style={{ borderLeft: '3px solid #0099cc' }}>
                      {(item as typeof item & { children: { href: string; label: string; icon?: (active: boolean) => React.ReactNode }[] }).children.map(child => {
                        const childActive = isChildActive(child.href)
                        return (
                          <Link key={child.href} href={child.href} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 20px 8px 28px',
                            backgroundColor: childActive ? 'rgba(0,153,204,0.25)' : 'transparent',
                            color: childActive ? 'white' : '#96aed2',
                            textDecoration: 'none', fontSize: 13,
                            fontFamily: 'Arial, sans-serif',
                            transition: 'background 0.15s',
                          }}>
                            {child.icon ? child.icon(childActive) : (
                              <svg width="4" height="4" viewBox="0 0 4 4">
                                <circle cx="2" cy="2" r="2" fill={childActive ? 'white' : '#96aed2'} />
                              </svg>
                            )}
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User + Docs + Logout */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(150,174,210,0.2)' }}>
        <p style={{ color: '#c8d4e8', fontSize: 13, margin: '0 0 10px', fontFamily: 'Arial, sans-serif', fontWeight: 600 }}>
          {userName ?? userEmail}
        </p>
        <Link href="/docs" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderRadius: 8, marginBottom: 8,
          background: 'rgba(150,174,210,0.12)',
          color: '#96aed2', textDecoration: 'none',
          fontSize: 13, fontFamily: 'Arial, sans-serif', fontWeight: 600,
          transition: 'background 0.15s',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {t('nav.docs')}
        </Link>
        <LogoutButton />
      </div>
    </aside>
  )
}
