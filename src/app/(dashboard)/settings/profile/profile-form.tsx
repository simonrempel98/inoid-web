'use client'

import { useState, useRef } from 'react'
import { updateProfile, changePassword, saveAvatarUrl } from './actions'
import { createClient } from '@/lib/supabase/client'
import { Check, Loader, KeyRound, User, Globe, Camera } from 'lucide-react'
import { LanguageSelector } from '@/components/language-selector'
import { useTranslations } from 'next-intl'

export function ProfileForm({ fullName, email, userId, avatarUrl: initialAvatarUrl }: {
  fullName: string; email: string; userId: string; avatarUrl: string | null
}) {
  const t = useTranslations('settings.profile')
  const [name, setName] = useState(fullName)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSaved, setPwSaved] = useState(false)

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setAvatarError('Maximale Dateigröße: 2 MB'); return }
    setUploadingAvatar(true)
    setAvatarError(null)
    const supabase = createClient()

    // Alte Dateien im Ordner löschen (verhindert verwaiste Dateien bei Formatwechsel)
    const { data: existing } = await supabase.storage.from('avatars').list(userId)
    if (existing && existing.length > 0) {
      await supabase.storage.from('avatars').remove(existing.map(f => `${userId}/${f.name}`))
    }

    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) { setAvatarError(upErr.message); setUploadingAvatar(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    // Cache-buster damit das neue Bild sofort angezeigt wird
    const urlWithBust = `${publicUrl}?t=${Date.now()}`
    await saveAvatarUrl(urlWithBust)
    setAvatarUrl(urlWithBust)
    setUploadingAvatar(false)
  }

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

      {/* ── Avatar ── */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={handleAvatarUpload}
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 90, height: 90, borderRadius: '50%', cursor: 'pointer',
              background: avatarUrl ? 'transparent' : 'linear-gradient(135deg, #003366, #0099cc)',
              border: '3px solid white',
              boxShadow: '0 2px 12px rgba(0,40,100,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative',
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 30, fontWeight: 800, color: 'white' }}>
                {name ? name[0].toUpperCase() : email[0].toUpperCase()}
              </span>
            )}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: uploadingAvatar ? 1 : 0,
              transition: 'opacity 0.2s',
            }}>
              {uploadingAvatar
                ? <Loader size={22} color="white" />
                : <Camera size={22} color="white" />}
            </div>
            {/* Hover overlay */}
            <style>{`.avatar-hover:hover > div:last-child { opacity: 1 !important; }`}</style>
          </div>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: '50%',
              background: '#003366', border: '2px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Camera size={13} color="white" />
          </div>
        </div>
        {avatarError && (
          <p style={{ fontSize: 12, color: '#E74C3C', marginTop: 8, textAlign: 'center' }}>{avatarError}</p>
        )}
      </div>

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
