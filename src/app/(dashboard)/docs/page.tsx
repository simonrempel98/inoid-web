'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  ClipboardList, ScanLine, CalendarClock, MapPin, Users,
  FileText, QrCode, CheckCircle2, ChevronDown,
  Zap, ShieldCheck, Smartphone, Upload, Bell, ArrowRight,
  ListChecks,
} from 'lucide-react'

// ─── Feature card ─────────────────────────────────────────────────────────────

type FeatureItem = {
  icon: React.ElementType
  color: string
  title: string
  badge: string
  desc: string
  points: string[]
}

function FeatureCard({ f }: { f: FeatureItem }) {
  const [open, setOpen] = useState(false)
  const Icon = f.icon
  return (
    <div style={{
      background: 'white', borderRadius: 16,
      border: `1px solid ${open ? f.color + '44' : '#c8d4e8'}`,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '16px 18px',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'flex-start', gap: 14, textAlign: 'left',
        }}
      >
        <span style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: `${f.color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={f.color} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#000' }}>{f.title}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8,
              background: `${f.color}18`, color: f.color,
            }}>{f.badge}</span>
          </div>
          <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
        </div>
        <span style={{
          flexShrink: 0, marginTop: 2, color: '#96aed2',
          transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          display: 'flex',
        }}>
          <ChevronDown size={18} />
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 18px 16px 72px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {f.points.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={14} color={f.color} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#444' }}>{p}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const router = useRouter()
  const t = useTranslations('docs')
  const [activeSection, setActiveSection] = useState<'start' | 'features' | 'roles' | 'tips'>('start')

  const QUICKSTART = [
    { step: '01', title: t('qs.s1title'), desc: t('qs.s1desc'), href: '/assets', color: '#0099cc' },
    { step: '02', title: t('qs.s2title'), desc: t('qs.s2desc'), href: '/scan', color: '#003366' },
    { step: '03', title: t('qs.s3title'), desc: t('qs.s3desc'), href: '/assets', color: '#005c8a' },
    { step: '04', title: t('qs.s4title'), desc: t('qs.s4desc'), href: '/wartung', color: '#00a8c8' },
  ]

  const FEATURES: FeatureItem[] = [
    { icon: ClipboardList, color: '#0099cc', title: t('feat.f1.title'), badge: t('feat.f1.badge'), desc: t('feat.f1.desc'), points: t.raw('feat.f1.points') as string[] },
    { icon: FileText, color: '#003366', title: t('feat.f2.title'), badge: t('feat.f2.badge'), desc: t('feat.f2.desc'), points: t.raw('feat.f2.points') as string[] },
    { icon: CalendarClock, color: '#005c8a', title: t('feat.f3.title'), badge: t('feat.f3.badge'), desc: t('feat.f3.desc'), points: t.raw('feat.f3.points') as string[] },
    { icon: ListChecks, color: '#7c3aed', title: t('feat.f4.title'), badge: t('feat.f4.badge'), desc: t('feat.f4.desc'), points: t.raw('feat.f4.points') as string[] },
    { icon: ScanLine, color: '#00a8c8', title: t('feat.f5.title'), badge: t('feat.f5.badge'), desc: t('feat.f5.desc'), points: t.raw('feat.f5.points') as string[] },
    { icon: MapPin, color: '#38b2d4', title: t('feat.f6.title'), badge: t('feat.f6.badge'), desc: t('feat.f6.desc'), points: t.raw('feat.f6.points') as string[] },
    { icon: Users, color: '#004e8c', title: t('feat.f7.title'), badge: t('feat.f7.badge'), desc: t('feat.f7.desc'), points: t.raw('feat.f7.points') as string[] },
    { icon: Upload, color: '#6b7d99', title: t('feat.f8.title'), badge: t('feat.f8.badge'), desc: t('feat.f8.desc'), points: t.raw('feat.f8.points') as string[] },
    { icon: QrCode, color: '#96aed2', title: t('feat.f9.title'), badge: t('feat.f9.badge'), desc: t('feat.f9.desc'), points: t.raw('feat.f9.points') as string[] },
  ]

  const ROLES = [
    { role: t('roles.r1.name'), color: '#003366', bg: '#e8f0f8', points: t.raw('roles.r1.points') as string[] },
    { role: t('roles.r2.name'), color: '#0077b6', bg: '#e6f4fb', points: t.raw('roles.r2.points') as string[] },
    { role: t('roles.r3.name'), color: '#6b7d99', bg: '#f4f6f9', points: t.raw('roles.r3.points') as string[] },
  ]

  const TIPS_LIST = [
    { icon: Zap, text: t('tips.t1') },
    { icon: CheckCircle2, text: t('tips.t2') },
    { icon: ShieldCheck, text: t('tips.t3') },
    { icon: Smartphone, text: t('tips.t4') },
    { icon: Bell, text: t('tips.t5') },
  ]

  const NAV_ITEMS = t.raw('tips.nav') as { a: string; b: string }[]

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', paddingBottom: 60 }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #003366 0%, #0077b6 60%, #0099cc 100%)',
        padding: '32px 20px 36px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

        <button type="button" onClick={() => router.back()} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.15)', border: 'none',
          borderRadius: 20, padding: '6px 12px 6px 8px',
          color: 'white', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', marginBottom: 20,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          {t('back')}
        </button>

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase',
            }}>{t('hero.eyebrow')}</span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'white', margin: '0 0 10px', lineHeight: 1.2 }}>
            {t('hero.h1a')}<br />{t('hero.h1b')}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: '0 0 24px', lineHeight: 1.6, maxWidth: 340 }}>
            {t('hero.sub')}
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { val: t('hero.s1val'), label: t('hero.s1label') },
              { val: t('hero.s2val'), label: t('hero.s2label') },
              { val: t('hero.s3val'), label: t('hero.s3label') },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'white', borderBottom: '1px solid #c8d4e8',
        display: 'flex', overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {([
          { key: 'start', label: t('tabs.start') },
          { key: 'features', label: t('tabs.features') },
          { key: 'roles', label: t('tabs.roles') },
          { key: 'tips', label: t('tabs.tips') },
        ] as const).map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveSection(tab.key)}
            style={{
              flexShrink: 0, padding: '13px 18px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700,
              color: activeSection === tab.key ? '#003366' : '#96aed2',
              borderBottom: activeSection === tab.key ? '2px solid #003366' : '2px solid transparent',
              transition: 'color 0.15s',
            }}
          >{tab.label}</button>
        ))}
      </div>

      <div style={{ padding: '20px 16px' }}>

        {/* ── Quick start ── */}
        {activeSection === 'start' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 4px', lineHeight: 1.6 }}>
              {t('qs.intro')}
            </p>
            {QUICKSTART.map((s, i) => (
              <div
                key={i}
                style={{
                  background: 'white', borderRadius: 16, padding: '18px 18px 18px 20px',
                  border: '1px solid #c8d4e8',
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: s.color }} />
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: `${s.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: s.color,
                }}>
                  {s.step}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#000', margin: '0 0 4px' }}>{s.title}</p>
                  <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px', lineHeight: 1.5 }}>{s.desc}</p>
                  <button
                    type="button"
                    onClick={() => router.push(s.href)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '7px 14px', borderRadius: 20,
                      background: s.color, border: 'none', cursor: 'pointer',
                      color: 'white', fontSize: 12, fontWeight: 700,
                    }}
                  >
                    {t('qs.open')} <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}

            {/* Demo placeholder */}
            <div style={{
              background: `linear-gradient(135deg, #003366, #0099cc)`,
              borderRadius: 16, padding: '24px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 12, textAlign: 'center',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: '0 0 4px' }}>{t('qs.demoTitle')}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0 }}>
                  {t('qs.demoSub')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Features ── */}
        {activeSection === 'features' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 4px', lineHeight: 1.6 }}>
              {t('feat.intro')}
            </p>
            {FEATURES.map((f, i) => <FeatureCard key={i} f={f} />)}
          </div>
        )}

        {/* ── Roles ── */}
        {activeSection === 'roles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 4px', lineHeight: 1.6 }}>
              {t('roles.intro')}
            </p>
            {ROLES.map(r => (
              <div key={r.role} style={{
                background: 'white', borderRadius: 16,
                border: `1px solid ${r.color}33`, overflow: 'hidden',
              }}>
                <div style={{
                  background: r.bg, padding: '12px 18px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: `1px solid ${r.color}22`,
                }}>
                  <ShieldCheck size={18} color={r.color} />
                  <span style={{ fontSize: 16, fontWeight: 800, color: r.color }}>{r.role}</span>
                </div>
                <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {r.points.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle2 size={14} color={r.color} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#444' }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{
              background: '#fffbe6', border: '1px solid #fde68a',
              borderRadius: 14, padding: '14px 16px',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
              <p style={{ fontSize: 13, color: '#555', margin: 0, lineHeight: 1.5 }}>
                {t('roles.tip')}
              </p>
            </div>
          </div>
        )}

        {/* ── Tips ── */}
        {activeSection === 'tips' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 4px', lineHeight: 1.6 }}>
              {t('tips.intro')}
            </p>

            {TIPS_LIST.map((tip, i) => {
              const Icon = tip.icon
              return (
                <div key={i} style={{
                  background: 'white', borderRadius: 14, padding: '16px 18px',
                  border: '1px solid #c8d4e8',
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: '#f0f4ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} color="#003366" />
                  </span>
                  <p style={{ fontSize: 14, color: '#333', margin: 0, lineHeight: 1.6 }}>{tip.text}</p>
                </div>
              )
            })}

            {/* Desktop navigation */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #f4f6f9' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#003366', margin: 0 }}>{t('tips.navTitle')}</p>
              </div>
              {NAV_ITEMS.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 18px', borderBottom: '1px solid #f4f6f9',
                }}>
                  <span style={{ fontSize: 13, color: '#444' }}>{item.a}</span>
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 8,
                    background: '#f4f6f9', color: '#666', fontFamily: 'monospace',
                  }}>{item.b}</span>
                </div>
              ))}
            </div>

            {/* Contact */}
            <div style={{
              background: 'linear-gradient(135deg, #003366, #0077b6)',
              borderRadius: 16, padding: '20px 20px',
              display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0 }}>{t('tips.contactTitle')}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.5 }}>
                {t('tips.contactDesc')}
              </p>
              <div style={{ marginTop: 4 }}>
                <a href="mailto:srl@inometa.de" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white', fontSize: 13, fontWeight: 700,
                  textDecoration: 'none',
                }}>
                  srl@inometa.de <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
