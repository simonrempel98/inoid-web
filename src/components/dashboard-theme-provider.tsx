'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type DsTheme = 'light' | 'dark'

const DsThemeContext = createContext<{
  theme: DsTheme
  toggle: () => void
}>({ theme: 'light', toggle: () => {} })

export function useDsTheme() {
  return useContext(DsThemeContext)
}

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<DsTheme>('light')

  useEffect(() => {
    const saved = localStorage.getItem('ds-theme') as DsTheme | null
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  function toggle() {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('ds-theme', next)
      return next
    })
  }

  return (
    <DsThemeContext.Provider value={{ theme, toggle }}>
      <div
        data-ds-theme={theme}
        style={{ minHeight: '100vh', background: 'var(--ds-bg)', fontFamily: 'Arial, sans-serif' }}
      >
        {children}
      </div>
    </DsThemeContext.Provider>
  )
}
