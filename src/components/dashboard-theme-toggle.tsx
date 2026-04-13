'use client'

import { useDsTheme } from './dashboard-theme-provider'
import { Sun, Moon } from 'lucide-react'

export function DashboardThemeToggle({ style }: { style?: React.CSSProperties }) {
  const { theme, toggle } = useDsTheme()

  return (
    <button
      onClick={toggle}
      title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34, borderRadius: 9,
        background: 'rgba(150,174,210,0.15)',
        border: '1px solid rgba(150,174,210,0.25)',
        cursor: 'pointer', color: '#96aed2',
        transition: 'background 0.2s',
        flexShrink: 0,
        ...style,
      }}
    >
      {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  )
}
