'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export function CategoryCombobox({ value, onChange, categories, inputStyle }: {
  value: string
  onChange: (v: string) => void
  categories: string[]
  inputStyle?: React.CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = value.trim()
    ? categories.filter(c => c.toLowerCase().includes(value.toLowerCase()))
    : categories

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="z.B. Bohrkronen"
          style={{ ...inputStyle, paddingRight: 32 }}
        />
        {categories.length > 0 && (
          <ChevronDown
            size={14} color="#96aed2"
            onClick={() => setOpen(o => !o)}
            style={{
              position: 'absolute', right: 10, cursor: 'pointer', flexShrink: 0,
              transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s',
            }}
          />
        )}
      </div>

      {open && filtered.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'white', border: '1px solid #c8d4e8', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          maxHeight: 200, overflowY: 'auto',
          marginTop: 4,
        }}>
          {filtered.map(cat => (
            <div key={cat} onClick={() => { onChange(cat); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 14px', cursor: 'pointer', fontSize: 14,
                background: value === cat ? '#f0f4ff' : 'transparent',
                color: '#000',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafd')}
              onMouseLeave={e => (e.currentTarget.style.background = value === cat ? '#f0f4ff' : 'transparent')}
            >
              <span>{cat}</span>
              {value === cat && <Check size={13} color="#003366" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
