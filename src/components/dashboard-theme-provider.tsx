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
    // Bereits vom blocking script auf <html> gesetzt — State synchronisieren
    const current = document.documentElement.getAttribute('data-ds-theme') as DsTheme | null
    const saved = localStorage.getItem('ds-theme') as DsTheme | null
    const initial = (saved === 'light' || saved === 'dark') ? saved : 'light'
    setTheme(current ?? initial)
    document.documentElement.setAttribute('data-ds-theme', current ?? initial)
  }, [])

  function toggle() {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('ds-theme', next)
      document.documentElement.setAttribute('data-ds-theme', next)
      return next
    })
  }

  return (
    <DsThemeContext.Provider value={{ theme, toggle }}>
      <div style={{ minHeight: '100vh', background: 'var(--ds-bg)', fontFamily: 'Arial, sans-serif' }}>
        {children}
      </div>
    </DsThemeContext.Provider>
  )
}
