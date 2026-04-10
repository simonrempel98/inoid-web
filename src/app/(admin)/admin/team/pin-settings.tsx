'use client'

import { useState } from 'react'

export function PinSettings({ hasPin }: { hasPin: boolean }) {
  const [mode, setMode] = useState<'idle' | 'set'>('idle')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{4}$/.test(newPin)) { setError('PIN muss genau 4 Ziffern sein'); return }
    if (newPin !== confirmPin) { setError('PINs stimmen nicht überein'); return }
    if (hasPin && !currentPin) { setError('Aktuellen PIN eingeben'); return }

    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pin: newPin,
        currentPin: hasPin ? currentPin : undefined,
      }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Fehler'); return }

    setSuccess(true)
    setMode('idle')
    setCurrentPin(''); setNewPin(''); setConfirmPin('')
    setTimeout(() => setSuccess(false), 3000)
  }

  const pinInput = (label: string, value: string, onChange: (v: string) => void, placeholder = '••••') => (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-text2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <input
        type="password"
        inputMode="numeric"
        maxLength={4}
        value={value}
        onChange={e => { if (/^\d*$/.test(e.target.value)) onChange(e.target.value) }}
        placeholder={placeholder}
        style={{
          width: 120, padding: '10px 14px', borderRadius: 8,
          border: '1px solid var(--adm-border2)', background: 'var(--adm-input-bg)', color: 'var(--adm-text)',
          fontSize: 20, fontFamily: 'monospace', outline: 'none',
          letterSpacing: '0.3em', boxSizing: 'border-box',
        }}
      />
    </div>
  )

  return (
    <div style={{ background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', padding: '20px', marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: mode === 'set' ? 20 : 0 }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--adm-text)' }}>Admin-PIN</p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text3)' }}>
            {hasPin
              ? 'PIN ist gesetzt — wird für kritische Aktionen verlangt'
              : 'Noch kein PIN gesetzt — kritische Aktionen sind gesperrt bis ein PIN gesetzt wird'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {success && <span style={{ fontSize: 12, color: '#34d399', fontWeight: 700 }}>✓ PIN gespeichert</span>}
          {!hasPin && !success && (
            <span style={{ fontSize: 11, background: '#451a03', color: '#f59e0b', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
              Nicht gesetzt
            </span>
          )}
          {mode === 'idle' && (
            <button
              onClick={() => setMode('set')}
              style={{
                padding: '8px 16px', borderRadius: 50, border: '1px solid var(--adm-border2)',
                background: 'transparent', color: 'var(--adm-text2)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {hasPin ? 'PIN ändern' : 'PIN setzen'}
            </button>
          )}
        </div>
      </div>

      {mode === 'set' && (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {hasPin && pinInput('Aktueller PIN', currentPin, setCurrentPin)}
            {pinInput(hasPin ? 'Neuer PIN' : 'PIN (4 Ziffern)', newPin, setNewPin, '0000')}
            {pinInput('Bestätigen', confirmPin, setConfirmPin, '0000')}
          </div>

          {error && <p style={{ margin: '12px 0 0', fontSize: 13, color: '#f87171' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'var(--adm-border2)' : '#003366', color: 'white',
                padding: '10px 24px', borderRadius: 50, border: 'none',
                fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {loading ? 'Wird gespeichert…' : 'PIN speichern'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('idle'); setError(null); setCurrentPin(''); setNewPin(''); setConfirmPin('') }}
              style={{
                background: 'transparent', color: 'var(--adm-text3)',
                padding: '10px 20px', borderRadius: 50, border: '1px solid var(--adm-border2)',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
