'use client'

import { useState } from 'react'

const placeholder = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="#96aed2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

export function AssetThumbnail({ url }: { url: string | undefined }) {
  const [broken, setBroken] = useState(false)

  if (!url || broken) return placeholder

  return (
    <img
      src={url}
      alt=""
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={() => setBroken(true)}
    />
  )
}
