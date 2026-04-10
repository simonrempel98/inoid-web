'use client'

import { useAdminTheme } from './admin-theme-provider'
import { Sun, Moon } from 'lucide-react'

export function AdminThemeToggle() {
  const { theme, toggle } = useAdminTheme()

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--adm-surface2)',
        border: '1px solid var(--adm-border)',
        cursor: 'pointer', color: 'var(--adm-text2)',
        transition: 'background 0.2s',
      }}
    >
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
