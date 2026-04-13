'use client'

import { useState, useMemo } from 'react'
import { WartungTaskList } from './wartung-task-list'
import { WartungTimeline, type ScheduleWithAsset } from './wartung-timeline'
import { CheckCircle2, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

type UrgencyFilter = 'all' | 'overdue' | 'week' | 'twoweeks' | 'month'

export function WartungTabs({ schedules }: { schedules: ScheduleWithAsset[] }) {
  const t = useTranslations()
  const [tab, setTab]                         = useState<'tasks' | 'gantt'>('tasks')
  const [search, setSearch]                   = useState('')
  const [filterCategory, setFilterCategory]   = useState('')
  const [filterUrgency, setFilterUrgency]     = useState<UrgencyFilter>('all')
  const [pageSize, setPageSize]               = useState(20)
  const [page, setPage]                       = useState(1)

  const URGENCY_OPTIONS: { value: UrgencyFilter; label: string }[] = [
    { value: 'all',      label: t('wartung.filter.all') },
    { value: 'overdue',  label: t('wartung.filter.overdue') },
    { value: 'week',     label: t('wartung.filter.week') },
    { value: 'twoweeks', label: t('wartung.filter.twoWeeks') },
    { value: 'month',    label: t('wartung.filter.month') },
  ]

  const rangeDays = filterUrgency === 'overdue'   ? 14
                  : filterUrgency === 'week'       ? 14
                  : filterUrgency === 'twoweeks'   ? 21
                  : filterUrgency === 'month'      ? 35
                  : 28

  const today   = new Date(); today.setHours(0, 0, 0, 0)
  const todayStr  = today.toISOString().slice(0, 10)
  const in7Str    = new Date(today.getTime() + 7  * 86400000).toISOString().slice(0, 10)
  const in14Str   = new Date(today.getTime() + 14 * 86400000).toISOString().slice(0, 10)
  const in30Str   = new Date(today.getTime() + 30 * 86400000).toISOString().slice(0, 10)

  const categories = useMemo(() => {
    const cats = schedules.map(s => s.assets?.category).filter((c): c is string => !!c)
    return [...new Set(cats)].sort()
  }, [schedules])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return schedules.filter(s => {
      if (q) {
        const a = s.assets
        const hit =
          s.name?.toLowerCase().includes(q) ||
          String(s.interval_days).includes(q) ||
          a?.title?.toLowerCase().includes(q) ||
          a?.category?.toLowerCase().includes(q) ||
          a?.status?.toLowerCase().includes(q) ||
          a?.serial_number?.toLowerCase().includes(q) ||
          a?.article_number?.toLowerCase().includes(q) ||
          a?.barcode?.toLowerCase().includes(q) ||
          a?.location_text?.toLowerCase().includes(q)
        if (!hit) return false
      }
      if (filterCategory && s.assets?.category !== filterCategory) return false
      if (filterUrgency !== 'all') {
        const d = s.next_service_date
        if (filterUrgency === 'overdue')   return d != null && d < todayStr
        if (filterUrgency === 'week')      return d != null && d >= todayStr && d <= in7Str
        if (filterUrgency === 'twoweeks')  return d != null && d >= todayStr && d <= in14Str
        if (filterUrgency === 'month')     return d != null && d >= todayStr && d <= in30Str
      }
      return true
    })
  }, [schedules, search, filterCategory, filterUrgency, todayStr, in7Str, in14Str, in30Str])

  const totalPages   = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage  = Math.min(page, totalPages)
  const paginated    = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const hasFilter = search !== '' || filterCategory !== '' || filterUrgency !== 'all'

  function resetFilters() {
    setSearch(''); setFilterCategory(''); setFilterUrgency('all'); setPage(1)
  }

  function pageNumbers(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '…')[] = [1]
    if (currentPage > 3) pages.push('…')
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) pages.push(p)
    if (currentPage < totalPages - 2) pages.push('…')
    pages.push(totalPages)
    return pages
  }

  const resultText = filtered.length === 0
    ? t('wartung.filter.noResults')
    : `${filtered.length} ${filtered.length === 1 ? t('wartung.filter.resultSingular') : t('wartung.filter.resultPlural')}${hasFilter ? ` ${t('common.of')} ${schedules.length}` : ''}`

  const inputStyle: React.CSSProperties = {
    padding: '9px 10px', borderRadius: 10,
    border: '1px solid var(--ds-border, #c8d4e8)',
    fontSize: 13, fontFamily: 'Arial, sans-serif',
    backgroundColor: 'var(--ds-input-bg, white)',
    color: 'var(--ds-text3, #666)',
    outline: 'none', cursor: 'pointer',
  }

  return (
    <div>
      {/* Filter Bar */}
      <div style={{ padding: '0 20px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Suchfeld */}
        <div style={{ position: 'relative' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#96aed2" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder={t('wartung.filter.searchPlaceholder')}
            style={{
              width: '100%', padding: '10px 12px 10px 38px', borderRadius: 12,
              border: `1px solid ${search ? '#003366' : 'var(--ds-border, #c8d4e8)'}`,
              fontSize: 13, fontFamily: 'Arial, sans-serif',
              backgroundColor: 'var(--ds-input-bg, white)',
              color: 'var(--ds-text, #000)',
              outline: 'none', boxSizing: 'border-box',
              transition: 'border-color 0.15s',
            }}
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setPage(1) }}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#96aed2', padding: 4, display: 'flex' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={filterUrgency} onChange={e => { setFilterUrgency(e.target.value as UrgencyFilter); setPage(1) }}
            style={{ ...inputStyle, flex: 1, minWidth: 120, border: `1px solid ${filterUrgency !== 'all' ? '#003366' : 'var(--ds-border, #c8d4e8)'}`, color: filterUrgency !== 'all' ? '#003366' : 'var(--ds-text3, #666)', fontWeight: filterUrgency !== 'all' ? 700 : 400 }}>
            {URGENCY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1) }}
            style={{ ...inputStyle, flex: 1, minWidth: 120, border: `1px solid ${filterCategory ? '#003366' : 'var(--ds-border, #c8d4e8)'}`, color: filterCategory ? '#003366' : 'var(--ds-text3, #666)', fontWeight: filterCategory ? 700 : 400 }}>
            <option value="">{t('wartung.filter.allCategories')}</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
            style={inputStyle}>
            <option value={10}>10 / {t('common.perPage')}</option>
            <option value={20}>20 / {t('common.perPage')}</option>
            <option value={50}>50 / {t('common.perPage')}</option>
          </select>

          {hasFilter && (
            <button type="button" onClick={resetFilters}
              style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--ds-border, #c8d4e8)', background: 'var(--ds-surface, white)', color: '#96aed2', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap' }}>
              × {t('wartung.filter.reset')}
            </button>
          )}
        </div>

        <p style={{ fontSize: 12, color: '#96aed2', margin: '0 0 8px' }}>
          {resultText}
          {totalPages > 1 && ` · ${t('common.page')} ${currentPage} / ${totalPages}`}
        </p>
      </div>

      {/* Tab-Leiste */}
      <div style={{ display: 'flex', padding: '0 20px', borderBottom: '2px solid var(--ds-border, #e8eef8)', marginBottom: 20, gap: 4 }}>
        <TabButton active={tab === 'tasks'} onClick={() => setTab('tasks')} icon={<CheckCircle2 size={14} />} label={t('wartung.tabs.tasks')} />
        <TabButton active={tab === 'gantt'} onClick={() => setTab('gantt')} icon={<BarChart2 size={14} />} label={t('wartung.tabs.gantt')} />
      </div>

      {/* Inhalt */}
      <div style={{ padding: '0 20px' }}>
        {tab === 'tasks' && <WartungTaskList schedules={paginated} />}
        {tab === 'gantt' && <WartungTimeline schedules={paginated} showFilters={true} rangeDays={rangeDays} />}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--ds-border, #c8d4e8)', background: currentPage === 1 ? 'var(--ds-surface2, #f4f6f9)' : 'var(--ds-surface, white)', color: currentPage === 1 ? 'var(--ds-border, #c8d4e8)' : '#003366', cursor: currentPage === 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={14} />
          </button>

          {pageNumbers().map((p, i) =>
            p === '…'
              ? <span key={`dots-${i}`} style={{ fontSize: 13, color: '#96aed2', padding: '0 2px' }}>…</span>
              : (
                <button key={p} type="button" onClick={() => setPage(p as number)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${p === currentPage ? '#003366' : 'var(--ds-border, #c8d4e8)'}`, background: p === currentPage ? '#003366' : 'var(--ds-surface, white)', color: p === currentPage ? 'white' : 'var(--ds-text3, #666)', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif' }}>
                  {p}
                </button>
              )
          )}

          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--ds-border, #c8d4e8)', background: currentPage === totalPages ? 'var(--ds-surface2, #f4f6f9)' : 'var(--ds-surface, white)', color: currentPage === totalPages ? 'var(--ds-border, #c8d4e8)' : '#003366', cursor: currentPage === totalPages ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string
}) {
  return (
    <button type="button" onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: active ? '#003366' : '#96aed2', borderBottom: active ? '2px solid #003366' : '2px solid transparent', marginBottom: -2, transition: 'color 0.15s' }}>
      {icon}{label}
    </button>
  )
}
