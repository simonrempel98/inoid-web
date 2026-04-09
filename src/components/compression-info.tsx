'use client'

import { formatBytes } from '@/lib/compress-image'

type Stat = { name: string; originalSize: number; compressedSize: number }

export function CompressionInfo({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null

  const totalOriginal = stats.reduce((s, x) => s + x.originalSize, 0)
  const totalCompressed = stats.reduce((s, x) => s + x.compressedSize, 0)
  const savedPct = totalOriginal > 0 ? Math.round((1 - totalCompressed / totalOriginal) * 100) : 0

  if (savedPct < 5) return null // Kein Banner wenn kaum gespart

  return (
    <div style={{
      background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
      padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 12, fontFamily: 'Arial, sans-serif', color: '#166534',
      marginTop: 8,
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <span>
        <strong>{savedPct}% kleiner</strong>
        {' '}— {formatBytes(totalOriginal)} → {formatBytes(totalCompressed)} komprimiert
      </span>
    </div>
  )
}
