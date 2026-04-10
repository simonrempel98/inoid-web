'use client'

// Placeholder für zukünftige interaktive Elemente auf der Maschinen-Detailseite
// (z.B. Drag & Drop, Inline-Edit von Druckwerk-Labels)
export function MachineClient({ machineId, canEdit }: { machineId: string; canEdit: boolean }) {
  if (!canEdit) return null

  return (
    <div style={{
      marginTop: 28,
      background: '#fef3c7',
      borderRadius: 12,
      border: '1px solid #f59e0b',
      padding: '12px 16px',
      display: 'flex', gap: 8, alignItems: 'center',
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p style={{ margin: 0, fontSize: 12, color: '#92400e', fontFamily: 'Arial, sans-serif' }}>
        Tipp: Verknüpfe Trägerstangen mit Assets über den &quot;verknüpfen&quot;-Link neben dem Slot.
        Druckwerk-Labels können über die Bearbeiten-Seite geändert werden.
      </p>
    </div>
  )
}
