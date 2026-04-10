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
    const saved = localStorage.getItem('admin-theme') as AdminTheme | null
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  function toggle() {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('admin-theme', next)
      return next
    })
  }

  return (
    <AdminThemeContext.Provider value={{ theme, toggle }}>
      <div data-admin-theme={theme} style={{ minHeight: '100vh', background: 'var(--adm-bg)', fontFamily: 'Arial, sans-serif' }}>
        {children}
      </div>
    </AdminThemeContext.Provider>
  )
}
