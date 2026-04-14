'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Users, MapPin, ChevronRight } from 'lucide-react'

type Team = {
  id: string
  name: string
  location_id: string | null
  hall_id: string | null
  area_id: string | null
  locations: { name: string } | null
  halls: { name: string } | null
  areas: { name: string } | null
}

function orgLabel(team: Team): string | null {
  if (team.area_id && team.areas) return team.areas.name
  if (team.hall_id && team.halls) return team.halls.name
  if (team.location_id && team.locations) return team.locations.name
  return null
}

export function TeamsTree({ teams }: { teams: Team[] }) {
  const t = useTranslations('teams')

  if (teams.length === 0) {
    return (
      <div style={{
        background: 'var(--ds-surface)', borderRadius: 14, border: '2px dashed #c8d4e8',
        padding: '48px 24px', textAlign: 'center',
      }}>
        <Users size={32} color="#c8d4e8" style={{ marginBottom: 12 }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: '#666', margin: '0 0 6px' }}>{t('noTeams')}</p>
        <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>{t('createFirst')}</p>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--ds-surface)', borderRadius: 14, border: '1px solid var(--ds-border)', overflow: 'hidden' }}>
      {teams.map((team, i) => {
        const label = orgLabel(team)
        return (
          <div key={team.id}>
            {i > 0 && <div style={{ height: 1, background: '#e8eef6', margin: '0 16px' }} />}
            <Link href={`/teams/team/${team.id}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', textDecoration: 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: '#e8f4ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Users size={16} color="#003366" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--ds-text)' }}>{team.name}</p>
                  {label && (
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#96aed2', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} /> {label}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight size={16} color="#96aed2" />
            </Link>
          </div>
        )
      })}
    </div>
  )
}
