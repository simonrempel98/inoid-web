'use client'

import { useState } from 'react'
import { updateProfile, changePassword } from './actions'
import { Check, Loader, KeyRound, User } from 'lucide-react'

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const [name, setName] = useState(fullName)
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSaved, setPwSaved] = useState(false)

  async function handleSaveName() {
    if (!name.trim()) return
    setSavingName(true)
    await updateProfile(name.trim())
    setSavingName(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2500)
  }

  async function handleChangePw() {
    setPwError(null)
    if (newPw.length < 8) { setPwError('Passwort muss mindestens 8 Zeichen haben.'); return }
    if (newPw !== confirmPw) { setPwError('Passwörter stimmen nicht überein.'); return }
    setSavingPw(true)
    const result = await changePassword(newPw)
    setSavingPw(false)
    if (result.error) { setPwError(result.error); return }
    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2500)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', outline: 'none', border: 'none',
    fontSize: 15, fontFamily: 'Arial, sans-serif',
    background: 'transparent', color: '#000',
  }

  return (
    <div style={{ padding: '24px 16px', fontFamily: 'Arial, sans-serif', maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000', margin: '0 0 24px' }}>Mein Profil</h1>

      {/* ── Profil ── */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 2px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <User size={11} /> Profildaten
        </p>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid #e8eef6' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#96aed2', marginBottom: 4, fontWeight: 700 }}>E-MAIL</label>
            <p style={{ margin: 0, fontSize: 15, color: '#666' }}>{email}</p>
          </div>
          <div style={{ padding: '13px 16px' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#96aed2', marginBottom: 4, fontWeight: 700 }}>NAME</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button onClick={handleSaveName} disabled={savingName || !name.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: nameSaved ? '#27AE60' : '#003366', color: 'white',
              border: 'none', borderRadius: 50, padding: '10px 20px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              opacity: savingName || !name.trim() ? 0.5 : 1,
              fontFamily: 'Arial, sans-serif', transition: 'background 0.2s',
            }}>
            {savingName ? <Loader size={13} /> : <Check size={13} />}
            {nameSaved ? 'Gespeichert!' : 'Speichern'}
          </button>
        </div>
      </div>

      {/* ── Passwort ── */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px 2px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <KeyRound size={11} /> Passwort ändern
        </p>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid #e8eef6' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#96aed2', marginBottom: 4, fontWeight: 700 }}>NEUES PASSWORT</label>
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              style={inputStyle}
            />
          </div>
          <div style={{ padding: '13px 16px' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#96aed2', marginBottom: 4, fontWeight: 700 }}>PASSWORT BESTÄTIGEN</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleChangePw()}
              style={inputStyle}
            />
          </div>
        </div>
        {pwError && (
          <p style={{ fontSize: 12, color: '#E74C3C', margin: '8px 0 0 2px' }}>{pwError}</p>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
          <button onClick={handleChangePw} disabled={savingPw || !newPw || !confirmPw}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: pwSaved ? '#27AE60' : '#003366', color: 'white',
              border: 'none', borderRadius: 50, padding: '10px 20px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              opacity: savingPw || !newPw || !confirmPw ? 0.5 : 1,
              fontFamily: 'Arial, sans-serif', transition: 'background 0.2s',
            }}>
            {savingPw ? <Loader size={13} /> : <KeyRound size={13} />}
            {pwSaved ? 'Geändert!' : 'Passwort ändern'}
          </button>
        </div>
      </div>
    </div>
  )
}
