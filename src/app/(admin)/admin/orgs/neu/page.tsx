'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminOrgNeuPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [plan, setPlan] = useState('starter')
  const [assetLimit, setAssetLimit] = useState(50)
  const [userLimit, setUserLimit] = useState(10)
  const [contactEmail, setContactEmail] = useState('')
  const [notes, setNotes] = useState('')

  // Features
  const [featServiceheft, setFeatServiceheft] = useState(true)
  const [featWartung, setFeatWartung] = useState(true)
  const [featTeamchat, setFeatTeamchat] = useState(true)
  const [featSensorik, setFeatSensorik] = useState(false)
  const [featFlexodruck, setFeatFlexodruck] = useState(false)
  const [featInoai, setFeatInoai] = useState(false)
  const [featKiImport, setFeatKiImport] = useState(false)

  // Dateigröße
  const SIZE_OPTIONS = [
    { label: '1 MB',       mb: 1   },
    { label: '5 MB',       mb: 5   },
    { label: '10 MB',      mb: 10  },
    { label: '25 MB',      mb: 25  },
    { label: '50 MB',      mb: 50  },
    { label: '100 MB',     mb: 100 },
    { label: 'Unbegrenzt', mb: 0   },
  ]
  const [docMaxSizeMb, setDocMaxSizeMb] = useState(10)

  // Bildkomprimierung
  const PRESETS = [
    { label: 'Original',  maxDim: null,  quality: 100 },
    { label: 'Hoch',      maxDim: 1920,  quality: 90  },
    { label: 'Mittel',    maxDim: 1280,  quality: 80  },
    { label: 'Niedrig',   maxDim: 800,   quality: 65  },
  ]
  const DIM_OPTIONS = [null, 2560, 1920, 1440, 1280, 1024, 800]
  const [compressionPreset, setCompressionPreset] = useState<number>(1)
  const [imageMaxDim, setImageMaxDim] = useState<number | null>(1920)
  const [imageQuality, setImageQuality] = useState(90)
  const [customMode, setCustomMode] = useState(false)

  function applyPreset(idx: number) {
    const p = PRESETS[idx]
    setCompressionPreset(idx)
    setImageMaxDim(p.maxDim)
    setImageQuality(p.quality)
    setCustomMode(false)
  }

  // Erster Admin-Nutzer der Org
  const [userEmail, setUserEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [tempPassword, setTempPassword] = useState('')

  function autoSlug(name: string) {
    return name.toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orgName.trim() || !orgSlug.trim() || !userEmail.trim() || !tempPassword.trim()) {
      setError('Pflichtfelder: Org-Name, Slug, Nutzer-E-Mail und Temp-Passwort')
      return
    }
    setLoading(true)
    setError(null)

    const res = await fetch('/api/admin/orgs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgName: orgName.trim(),
        orgSlug: orgSlug.trim(),
        plan,
        assetLimit,
        userLimit,
        contactEmail: contactEmail.trim() || null,
        notes: notes.trim() || null,
        features: { serviceheft: featServiceheft, wartung: featWartung, teamchat: featTeamchat, sensorik: featSensorik, flexodruck: featFlexodruck, inoai: featInoai, ki_import: featKiImport },
        settings: {
          image_max_dim: imageMaxDim ?? null,
          image_quality: imageQuality,
          doc_max_size_mb: docMaxSizeMb,
        },
        userEmail: userEmail.trim(),
        userName: userName.trim() || null,
        tempPassword,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Fehler')
      setLoading(false)
      return
    }

    router.push(`/admin/orgs/${data.orgId}`)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--adm-border2)', background: 'var(--adm-input-bg)', color: 'var(--adm-text)',
    fontSize: 14, fontFamily: 'Arial, sans-serif', outline: 'none',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--adm-text2)',
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
  }
  const sectionStyle: React.CSSProperties = {
    background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)',
    padding: '20px', marginBottom: 16,
  }

  const ToggleRow = ({ label, description, value, onChange }: {
    label: string
    description: string
    value: boolean
    onChange: (v: boolean) => void
  }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: '1px solid var(--adm-border)',
    }}>
      <div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--adm-text)' }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--adm-text3)' }}>{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: 48, height: 26, borderRadius: 13, border: 'none',
          background: value ? '#0099cc' : 'var(--adm-border2)',
          position: 'relative', cursor: 'pointer', flexShrink: 0,
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: value ? 25 : 3,
          width: 20, height: 20, borderRadius: '50%', background: 'white',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--adm-text)', margin: '0 0 4px' }}>Neue Organisation anlegen</h1>
        <p style={{ fontSize: 13, color: 'var(--adm-text3)', margin: 0 }}>Erstellt Org + ersten Admin-Nutzer mit Temp-Passwort</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Org Daten */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
            Organisation
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Name *</label>
              <input
                value={orgName}
                onChange={e => { setOrgName(e.target.value); if (!slugEdited) setOrgSlug(autoSlug(e.target.value)) }}
                placeholder="Musterfirma GmbH"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Slug *</label>
              <input
                value={orgSlug}
                onChange={e => { setOrgSlug(e.target.value); setSlugEdited(true) }}
                placeholder="musterfirma-gmbh"
                required
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Plan</label>
              <select value={plan} onChange={e => setPlan(e.target.value)} style={inputStyle}>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Asset-Limit</label>
              <input
                type="number" min={1} value={assetLimit}
                onChange={e => setAssetLimit(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Nutzer-Limit</label>
              <input
                type="number" min={1} value={userLimit}
                onChange={e => setUserLimit(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Kontakt-E-Mail</label>
              <input
                type="email" value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="kontakt@firma.de"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Notizen</label>
              <input
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Interne Notizen..."
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
            Features
          </h2>
          <p style={{ fontSize: 12, color: 'var(--adm-text4)', margin: '0 0 12px' }}>
            Legt fest welche Funktionen dieser Organisation zur Verfügung stehen.
          </p>
          <ToggleRow
            label="Serviceheft"
            description="Serviceeinträge & Dokumentation pro Asset"
            value={featServiceheft}
            onChange={setFeatServiceheft}
          />
          <ToggleRow
            label="Wartung"
            description="Wartungspläne, Aufgaben & Gantt-Chart"
            value={featWartung}
            onChange={setFeatWartung}
          />
          <ToggleRow
            label="Team-Chat"
            description="Team-interne Nachrichten mit Asset-Erwähnungen (30 Tage Verlauf)"
            value={featTeamchat}
            onChange={setFeatTeamchat}
          />
          <ToggleRow
            label="Sensorik"
            description="Echtzeit-Sensordaten je Asset: Temperatur, Vibration, Drehzahl u.v.m."
            value={featSensorik}
            onChange={setFeatSensorik}
          />
          <ToggleRow
            label="Flexodruck"
            description="Setup-Manager für Flexodruck-Maschinen: Druckwerke, Vorlagen & Rüstvorgänge"
            value={featFlexodruck}
            onChange={setFeatFlexodruck}
          />
          <ToggleRow
            label="INOai"
            description="KI-Produktassistent auf Basis der INOMETA-Wissensbasis"
            value={featInoai}
            onChange={setFeatInoai}
          />
          <ToggleRow
            label="KI-Import"
            description="Asset-Import per KI: Daten aus Fotos, Dokumenten oder Text automatisch auslesen"
            value={featKiImport}
            onChange={setFeatKiImport}
          />
        </div>

        {/* Bildkomprimierung */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
            Bildkomprimierung
          </h2>
          <p style={{ fontSize: 12, color: 'var(--adm-text4)', margin: '0 0 14px' }}>
            Legt fest wie Bilder beim Upload für diese Organisation komprimiert werden.
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyPreset(i)}
                style={{
                  padding: '7px 16px', borderRadius: 50, fontSize: 12, fontWeight: 700,
                  border: !customMode && compressionPreset === i ? '1.5px solid #0099cc' : '1.5px solid var(--adm-border2)',
                  background: !customMode && compressionPreset === i ? 'var(--adm-accent-bg)' : 'transparent',
                  color: !customMode && compressionPreset === i ? '#0099cc' : 'var(--adm-text3)',
                  cursor: 'pointer', fontFamily: 'Arial, sans-serif',
                }}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => { setCustomMode(true); setCompressionPreset(-1) }}
              style={{
                padding: '7px 16px', borderRadius: 50, fontSize: 12, fontWeight: 700,
                border: customMode ? '1.5px solid #0099cc' : '1.5px solid var(--adm-border2)',
                background: customMode ? 'var(--adm-accent-bg)' : 'transparent',
                color: customMode ? '#0099cc' : 'var(--adm-text3)',
                cursor: 'pointer', fontFamily: 'Arial, sans-serif',
              }}
            >
              Eigene
            </button>
          </div>

          {customMode && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Max. Auflösung</label>
                <select
                  value={imageMaxDim ?? 'original'}
                  onChange={e => setImageMaxDim(e.target.value === 'original' ? null : Number(e.target.value))}
                  style={inputStyle}
                >
                  <option value="original">Original (keine Grenze)</option>
                  {DIM_OPTIONS.filter(Boolean).map(d => (
                    <option key={d} value={d!}>{d} px</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Qualität: {imageQuality}%</label>
                <input
                  type="range" min={40} max={100} value={imageQuality}
                  onChange={e => setImageQuality(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#0099cc', marginTop: 10 }}
                />
              </div>
            </div>
          )}

          {!customMode && (
            <p style={{ fontSize: 12, color: 'var(--adm-text4)', margin: 0 }}>
              {PRESETS[compressionPreset]?.maxDim
                ? `Max. ${PRESETS[compressionPreset].maxDim} px · Qualität ${PRESETS[compressionPreset].quality}%`
                : 'Keine Komprimierung – Bilder werden unverändert gespeichert'}
            </p>
          )}
        </div>

        {/* Dateigröße */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>
            Dokument-Uploads
          </h2>
          <p style={{ fontSize: 12, color: 'var(--adm-text4)', margin: '0 0 14px' }}>
            Maximale Dateigröße für Dokument-Uploads dieser Organisation.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SIZE_OPTIONS.map(opt => (
              <button
                key={opt.mb}
                type="button"
                onClick={() => setDocMaxSizeMb(opt.mb)}
                style={{
                  padding: '7px 16px', borderRadius: 50, fontSize: 12, fontWeight: 700,
                  border: docMaxSizeMb === opt.mb ? '1.5px solid #0099cc' : '1.5px solid var(--adm-border2)',
                  background: docMaxSizeMb === opt.mb ? 'var(--adm-accent-bg)' : 'transparent',
                  color: docMaxSizeMb === opt.mb ? '#0099cc' : 'var(--adm-text3)',
                  cursor: 'pointer', fontFamily: 'Arial, sans-serif',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--adm-text4)', margin: '10px 0 0' }}>
            {docMaxSizeMb === 0 ? 'Keine Größenbeschränkung für Uploads.' : `Dateien größer als ${docMaxSizeMb} MB werden abgelehnt.`}
          </p>
        </div>

        {/* Erster Nutzer */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text3)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px' }}>
            Erster Admin-Nutzer
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>E-Mail *</label>
              <input
                type="email" value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                placeholder="admin@firma.de"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Name</label>
              <input
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="Max Mustermann"
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Temporäres Passwort *</label>
            <input
              value={tempPassword}
              onChange={e => setTempPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              required
              style={inputStyle}
            />
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--adm-text3)' }}>
              Nutzer wird als Superadmin angelegt und muss das Passwort beim ersten Login ändern.
            </p>
          </div>
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? 'var(--adm-border2)' : '#003366', color: 'white',
              padding: '12px 28px', borderRadius: 50, border: 'none',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {loading ? 'Wird angelegt…' : 'Organisation anlegen'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              background: 'transparent', color: 'var(--adm-text2)',
              padding: '12px 20px', borderRadius: 50, border: '1px solid var(--adm-border2)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  )
}
