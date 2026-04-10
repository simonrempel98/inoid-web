'use client'

import { useEffect, useState } from 'react'

export function AssetQrDisplay({ url, assetId }: { url: string; assetId: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    import('qrcode').then(mod => {
      mod.default.toDataURL(url, {
        width: 200, margin: 2,
        color: { dark: '#003366', light: '#ffffff' },
      }).then(dataUrl => {
        if (!cancelled) setQrDataUrl(dataUrl)
      })
    })
    return () => { cancelled = true }
  }, [url])

  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      {/* QR Code */}
      {qrDataUrl ? (
        <img src={qrDataUrl} alt="QR Code"
          style={{ width: 160, height: 160, borderRadius: 12, display: 'block' }} />
      ) : (
        <div style={{
          width: 160, height: 160, borderRadius: 12,
          backgroundColor: '#f4f6f9', border: '1px solid #c8d4e8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ color: '#96aed2', fontSize: 12, fontFamily: 'Arial, sans-serif' }}>Lädt…</span>
        </div>
      )}

      {/* UUID mit Copy */}
      <div>
        <p style={{ fontSize: 11, color: '#96aed2', fontWeight: 700, margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }}>
          UUID / NFC-Tag
        </p>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <p style={{
            flex: 1, fontSize: 11, color: '#003366', fontFamily: 'monospace',
            wordBreak: 'break-all', margin: 0,
            background: '#f4f6f9', borderRadius: 6, padding: '6px 8px', border: '1px solid #c8d4e8',
          }}>
            {url}
          </p>
          <button type="button" onClick={copy} style={{
            flexShrink: 0, padding: '6px 10px', borderRadius: 8,
            border: '1px solid #c8d4e8', background: copied ? '#e8f5e9' : 'white',
            color: copied ? '#2e7d32' : '#003366', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap',
          }}>
            {copied ? '✓' : 'Kopieren'}
          </button>
        </div>
      </div>
    </div>
  )
}
