'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type AdminTheme = 'dark' | 'light'

const AdminThemeContext = createContext<{
  theme: AdminTheme
  toggle: () => void
}>({ theme: 'dark', toggle: () => {} })

export function useAdminTheme() {
  return useContext(AdminThemeContext)
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<AdminTheme>('dark')

  useEffect(() => {
    // Bereits vom blocking script auf <html> gesetzt — State synchronisieren
    const current = document.documentElement.getAttribute('data-admin-theme') as AdminTheme | null
    const saved = localStorage.getItem('admin-theme') as AdminTheme | null
    const initial = (saved === 'dark' || saved === 'light') ? saved : 'dark'
    setTheme(current ?? initial)
    document.documentElement.setAttribute('data-admin-theme', current ?? initial)
  }, [])

  function toggle() {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('admin-theme', next)
      document.documentElement.setAttribute('data-admin-theme', next)
      return next
    })
  }

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      <div style={{ minHeight: '100vh', background: 'var(--adm-bg)', fontFamily: 'Arial, sans-serif' }}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  )
}
