'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AssetImportModal } from '@/components/asset-import/import-modal'

export function AssetImportButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          backgroundColor: 'white', color: '#003366',
          border: '1.5px solid #003366',
          padding: '10px 16px', borderRadius: 50,
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}
      >
        <Sparkles size={15} />
        KI-Import
      </button>

      {open && <AssetImportModal onClose={() => setOpen(false)} />}
    </>
  )
}
