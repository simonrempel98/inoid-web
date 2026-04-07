export default function ScanPage() {
  return (
    <div style={{ padding: '32px 16px', fontFamily: 'Arial, sans-serif', maxWidth: 480, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#000000', marginBottom: 8 }}>Scannen</h1>
      <p style={{ color: '#666666', fontSize: 14, marginBottom: 32 }}>
        NFC-Tag oder QR-Code scannen um ein Asset direkt zu öffnen.
      </p>

      {/* Scan Card */}
      <div style={{
        background: 'white', borderRadius: 20, padding: 32,
        boxShadow: '0 2px 12px rgba(0,51,102,0.1)',
        border: '1px solid #c8d4e8',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      }}>
        {/* Pulsierender Scan-Kreis */}
        <div style={{ position: 'relative', width: 140, height: 140 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2px solid #c8d4e8', animation: 'pulse 2s infinite',
          }} />
          <div style={{
            position: 'absolute', inset: 16, borderRadius: '50%',
            border: '2px solid #96aed2',
          }} />
          <div style={{
            position: 'absolute', inset: 32, borderRadius: '50%',
            backgroundColor: '#003366',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
              <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
              <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
              <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
              <rect x="7" y="7" width="10" height="10" rx="1"/>
            </svg>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: 18, color: '#000000', margin: '0 0 8px' }}>
            Asset scannen
          </p>
          <p style={{ color: '#666666', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
            Halte dein Gerät an den NFC-Tag der Komponente oder scanne den QR-Code.
          </p>
        </div>

        <button style={{
          backgroundColor: '#003366', color: 'white',
          padding: '14px 40px', borderRadius: 50,
          border: 'none', fontWeight: 700, fontSize: 16,
          cursor: 'pointer', fontFamily: 'Arial, sans-serif',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
            <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
            <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
            <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
            <rect x="7" y="7" width="10" height="10" rx="1"/>
          </svg>
          Scannen starten
        </button>
      </div>

      {/* Info */}
      <div style={{
        marginTop: 20, padding: '14px 16px', borderRadius: 12,
        backgroundColor: '#c8d4e8', display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p style={{ fontSize: 13, color: '#003366', margin: 0, lineHeight: 1.5 }}>
          Die Kamera-Funktion für QR-Codes wird in Phase 4 vollständig implementiert.
          NFC-Scan ist in der mobilen App verfügbar.
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}
