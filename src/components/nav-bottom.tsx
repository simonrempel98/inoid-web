'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { LogoutButton } from './logout-button'

// ── Icons ──────────────────────────────────────────────────────────────────────

const icon = (path: React.ReactNode, size = 22, color = '#96aed2') => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
)

const icons = {
  dashboard: (c: string) => icon(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>, 22, c),
  assets:    (c: string) => icon(<><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></>, 22, c),
  scan:      icon(<><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></>, 26, 'white'),
  wartung:   (c: string) => icon(<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>, 22, c),
  org:       (c: string) => icon(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>, 24, c),
  teams:     (c: string) => icon(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>, 24, c),
  docs:      (c: string) => icon(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>, 24, c),
  profile:   (c: string) => icon(<><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></>, 24, c),
  close:     icon(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>, 16, 'white'),
  dots:      icon(<><circle cx="12" cy="5" r="1.2" fill="#96aed2" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="#96aed2" stroke="none"/><circle cx="12" cy="19" r="1.2" fill="#96aed2" stroke="none"/></>, 22),
}

// ── Component ──────────────────────────────────────────────────────────────────

export function BottomNav({
  features = {},
  userEmail,
  userName,
  avatarUrl,
}: {
  features?: Record<string, boolean>
  userEmail?: string
  userName?: string
  avatarUrl?: string
}) {
  const pathname = usePathname()
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const showWartung = features.wartung !== false

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [pathname])

  const isActive = (href: string) => {
    if (href === '/assets') return pathname.startsWith('/assets')
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (userEmail?.[0] ?? '?').toUpperCase()

  const DRAWER_ITEMS = [
    { href: '/mehr',         labelKey: 'nav.profile',       color: '#003366', iconFn: icons.profile },
    { href: '/organisation', labelKey: 'nav.organisation',  color: '#0077b6', iconFn: icons.org },
    { href: '/teams',        labelKey: 'nav.teams',         color: '#005c8a', iconFn: icons.teams },
    { href: '/docs',         labelKey: 'nav.docs',          color: '#0099cc', iconFn: icons.docs },
  ]

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 48,
          background: 'rgba(0,20,50,0.45)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* ── Drawer ── */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0,
        zIndex: 49,
        background: 'white',
        borderRadius: '22px 22px 0 0',
        boxShadow: '0 -6px 40px rgba(0,40,100,0.18)',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#dde4ee' }} />
        </div>

        {/* User Card */}
        <div style={{
          margin: '6px 16px 14px',
          background: 'linear-gradient(135deg, #003366 0%, #0077b6 100%)',
          borderRadius: 18, padding: '16px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
            background: avatarUrl ? 'transparent' : 'rgba(255,255,255,0.18)',
            border: '2px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 16, fontWeight: 800, color: 'white', fontFamily: 'Arial, sans-serif' }}>
                {initials}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Arial, sans-serif' }}>
              {userName ?? userEmail}
            </p>
            {userName && userEmail && (
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Arial, sans-serif' }}>
                {userEmail}
              </p>
            )}
          </div>
        </div>

        {/* Navigation Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '0 16px 16px' }}>
          {DRAWER_ITEMS.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: active ? `${item.color}12` : '#f4f7fb',
                  borderRadius: 16, padding: '14px 8px 12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                  border: `1.5px solid ${active ? item.color + '44' : 'transparent'}`,
                  transition: 'background 0.15s',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 13,
                    background: active ? `${item.color}20` : 'white',
                    boxShadow: active ? 'none' : '0 1px 6px rgba(0,40,100,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.iconFn(active ? item.color : '#6b7d99')}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: active ? 700 : 600,
                    color: active ? item.color : '#5a6b80',
                    textAlign: 'center', lineHeight: 1.2,
                    fontFamily: 'Arial, sans-serif',
                  }}>
                    {t(item.labelKey)}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#eef1f6', margin: '0 16px 12px' }} />

        {/* Logout */}
        <div style={{ padding: '0 16px' }}>
          <LogoutButton />
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #dde4ee',
        display: 'flex', alignItems: 'flex-end',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 50,
        boxShadow: '0 -1px 0 rgba(0,40,100,0.06)',
      }}>

        <NavItem href="/dashboard" label={t('nav.dashboard')} active={isActive('/dashboard')}>
          {icons.dashboard(isActive('/dashboard') ? '#003366' : '#96aed2')}
        </NavItem>

        <NavItem href="/assets" label={t('nav.assetsShort')} active={isActive('/assets')}>
          {icons.assets(isActive('/assets') ? '#003366' : '#96aed2')}
        </NavItem>

        {/* SCAN – center floating button */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', paddingBottom: 8 }}>
          <Link href="/scan" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: 58, height: 58, borderRadius: '50%',
              background: isActive('/scan')
                ? 'linear-gradient(135deg, #0077b6, #00b4d8)'
                : 'linear-gradient(135deg, #003366, #0099cc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 18px rgba(0,51,102,0.38)',
              marginTop: -22,
              border: '3px solid white',
              transition: 'background 0.2s',
            }}>
              {icons.scan}
            </div>
            <span style={{ fontSize: 10, fontFamily: 'Arial, sans-serif', fontWeight: 700, color: '#003366' }}>
              {t('nav.scan')}
            </span>
          </Link>
        </div>

        {showWartung ? (
          <NavItem href="/wartung" label={t('nav.wartungShort')} active={isActive('/wartung')}>
            {icons.wartung(isActive('/wartung') ? '#003366' : '#96aed2')}
          </NavItem>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        {/* Mehr – öffnet Drawer */}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', padding: '10px 0 8px',
            background: 'none', border: 'none', cursor: 'pointer', gap: 3,
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: open ? '#003366' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s',
          }}>
            {open ? icons.close : icons.dots}
          </div>
          <span style={{
            fontSize: 10, fontFamily: 'Arial, sans-serif',
            fontWeight: open ? 700 : 400,
            color: open ? '#003366' : '#96aed2',
          }}>
            {t('nav.more')}
          </span>
          {open && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#003366' }} />}
        </button>

      </nav>
    </>
  )
}

// ── NavItem ────────────────────────────────────────────────────────────────────

function NavItem({ href, label, active, children }: {
  href: string; label: string; active: boolean; children: React.ReactNode
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
      {active && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#003366' }} />}
    </Link>
  )
}
