'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  title: string
  description?: string
  onConfirm: (pin: string) => Promise<void>
  onCancel: () => void
  danger?: boolean
}

export function AdminPinModal({ title, description, onConfirm, onCancel, danger = false }: Props) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    refs[0].current?.focus()
  }, [])

  function handleDigit(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const d = [...digits]
    d[index] = value.slice(-1)
    setDigits(d)
    setError(null)
    if (value && index < 3) {
      refs[index + 1].current?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs[index - 1].current?.focus()
    }
    if (e.key === 'Enter') {
      const pin = digits.join('')
      if (pin.length === 4) submit(pin)
    }
  }

  async function submit(pin?: string) {
    const p = pin ?? digits.join('')
    if (p.length !== 4) { setError('Bitte alle 4 Ziffern eingeben'); return }

    setLoading(true)
    setError(null)

    // PIN serverseitig verifizieren
    const res = await fetch('/api/admin/pin', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: p }),
    })
    const data = await res.json()

    if (!res.ok || !data.valid) {
      setDigits(['', '', '', ''])
      refs[0].current?.focus()
      setError(data.error ?? 'PIN falsch')
      setLoading(false)
      return
    }

    try {
      await onConfirm(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler')
      setLoading(false)
    }
  }

  const pin = digits.join('')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}
      onClick={e => { if (e.target === e.currentTarget && !loading) onCancel() }}
    >
      <div style={{
        background: '#111827', borderRadius: 16,
        border: `1px solid ${danger ? '#7f1d1d' : '#374151'}`,
        padding: '32px 28px',
        width: '100%', maxWidth: 360,
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: danger ? '#450a0a' : '#0c1a2e',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
            stroke={danger ? '#ef4444' : '#60a5fa'}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: 'white' }}>{title}</p>
        {description && (
          <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{description}</p>
        )}

        {/* 4-stellige PIN-Eingabe */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={loading}
              style={{
                width: 52, height: 60, borderRadius: 10, border: 'none',
                background: d ? (danger ? '#450a0a' : '#0c1a2e') : '#1f2937',
                color: 'white', fontSize: 24, fontWeight: 800,
                textAlign: 'center', outline: 'none', fontFamily: 'Arial, sans-serif',
                boxShadow: d ? `0 0 0 2px ${danger ? '#ef4444' : '#0099cc'}` : 'none',
                transition: 'box-shadow 0.1s, background 0.1s',
                cursor: loading ? 'default' : 'text',
              }}
            />
          ))}
        </div>

        {error && (
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#f87171', fontWeight: 600 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => submit()}
            disabled={pin.length !== 4 || loading}
            style={{
              flex: 1, padding: '12px',
              borderRadius: 8, border: 'none',
              background: pin.length === 4 && !loading
                ? (danger ? '#dc2626' : '#003366')
                : '#374151',
              color: 'white',
              fontSize: 14, fontWeight: 700,
              cursor: pin.length === 4 && !loading ? 'pointer' : 'default',
              fontFamily: 'Arial, sans-serif',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Prüfe…' : 'Bestätigen'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1, padding: '12px',
              borderRadius: 8, border: '1px solid #374151',
              background: 'transparent', color: '#9ca3af',
              fontSize: 14, fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )
}
