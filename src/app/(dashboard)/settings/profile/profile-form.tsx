'use client'

import { useState } from 'react'
import { updateProfile, changePassword } from './actions'
import { Check, Loader, KeyRound, User, Globe } from 'lucide-react'
import { LanguageSelector } from '@/components/language-selector'
import { useTranslations } from 'next-intl'

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const t = useTranslations('settings.profile')
  const [name, setName] = useState(fullName)
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

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
    if (newPw.length < 8) { setPwError(t('pwTooShort')); return }
    if (newPw !== confirmPw) { setPwError(t('pwMismatch')); return }
    setSavingPw(true)
    const result = await changePassword(newPw)
    setSavingPw(false)
    if (result.error) { setPwError(result.error); return }
    setNewPw(''); setConfirmPw('')
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2500)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', outline: 'none', border: 'none',
    fontSize: 15, fontFamily: 'Arial, sans-serif',
    background: 'transparent', color: '#000',
  }

  const sectionLabelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#666',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    margin: '0 0 8px 2px', display: 'flex', alignItems: 'center', gap: 5,
  }

  return (
    <div style={{ padding: '24px 16px', fontFamily: 'Arial, sans-serif', maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#000', margin: '0 0 24px' }}>{t('title')}</h1>

      {/* ── Profildaten ── */}
      <div style={{ marginBottom: 24 }}>
        <p style={sectionLabelStyle}>
          <User size={11} /> {t('title')}
        </p>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid #e8eef6' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#96aed2', marginBottom: 4, fontWeight: 700 }}>
              {t('email').toUpperCase()}
            </label>
            <p style={{ margin: 0, fontSize: 15, color: '#666' }}>{email}</p>
          </div>
          <div style={{ padding: '13px 16px' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#96aed2', marginBottom: 4, fontWeight: 700 }}>
              {t('fullName').toUpperCase()}
            </label>
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
            {nameSaved ? t('saved') : t('save')}
          </button>
        </div>
      </div>

      {/* ── Sprache ── */}
      <div style={{ marginBottom: 24 }}>
        <p style={sectionLabelStyle}>
          <Globe size={11} /> {t('language')}
        </p>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', padding: '14px 16px' }}>
          <p style={{ fontSize: 12, color: '#96aed2', margin: '0 0 10px' }}>{t('languageSubtitle')}</p>
          <LanguageSelector />
        </div>
      </div>

      {/* ── Passwort ── */}
      <div>
        <p style={sectionLabelStyle}>
          <KeyRound size={11} /> {t('changePassword')}
        </p>
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #c8d4e8', overflow: 'hidden' }}>
          <div style={{ padding: '13px 16px', borderBottom: '1px solid #e8eef6' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#96aed2', marginBottom: 4, fontWeight: 700 }}>
              {t('newPassword').toUpperCase()}
            </label>
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder={t('minChars')}
              style={inputStyle}
            />
          </div>
          <div style={{ padding: '13px 16px' }}>
            <label style={{ display: 'block', fontSize: 11, color: '#96aed2', marginBottom: 4, fontWeight: 700 }}>
              {t('confirmPassword').toUpperCase()}
            </label>
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
            {pwSaved ? t('passwordSaved') : t('changePassword')}
          </button>
        </div>
      </div>
    </div>
  )
}
