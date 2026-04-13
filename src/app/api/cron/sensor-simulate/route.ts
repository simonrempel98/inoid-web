import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/cron/sensor-simulate
 *
 * Wird von Vercel Cron alle 5 Minuten aufgerufen.
 * Generiert für alle aktiven Sensoren einen realistischen Zufallswert
 * und schreibt ihn in sensor_readings — ohne Simulator auf dem Laptop.
 *
 * Absicherung: Vercel sendet automatisch Authorization: Bearer {CRON_SECRET}.
 */

const TYPE_RANGES: Record<string, { min: number; max: number; decimals: number }> = {
  temperature: { min: 20,  max: 85,   decimals: 1 },
  vibration:   { min: 0,   max: 15,   decimals: 2 },
  pressure:    { min: 1,   max: 12,   decimals: 2 },
  current:     { min: 5,   max: 95,   decimals: 1 },
  power:       { min: 10,  max: 450,  decimals: 1 },
  energy:      { min: 0,   max: 9999, decimals: 2 },
  humidity:    { min: 20,  max: 95,   decimals: 1 },
  rpm:         { min: 0,   max: 3000, decimals: 0 },
  runtime:     { min: 0,   max: 9999, decimals: 2 },
  level:       { min: 10,  max: 100,  decimals: 1 },
  flow:        { min: 0,   max: 500,  decimals: 1 },
  noise:       { min: 40,  max: 110,  decimals: 1 },
  co2:         { min: 400, max: 1800, decimals: 0 },
  generic:     { min: 0,   max: 100,  decimals: 1 },
}

function randomValue(type: string): number {
  const r = TYPE_RANGES[type] ?? TYPE_RANGES.generic
  const raw = r.min + Math.random() * (r.max - r.min)
  return parseFloat(raw.toFixed(r.decimals))
}

export async function GET(req: NextRequest) {
  try {
    // Vercel Cron sendet Authorization: Bearer {CRON_SECRET}
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const auth = req.headers.get('authorization')
      if (auth !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const supabase = createAdminClient()

    // Alle aktiven Sensoren laden
    const { data: sensors, error } = await supabase
      .from('sensors')
      .select('id, type')
      .eq('is_active', true)

    if (error) {
      console.error('[sensor-simulate] Fehler beim Laden der Sensoren:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!sensors?.length) {
      return NextResponse.json({ ok: true, inserted: 0, message: 'Keine aktiven Sensoren' })
    }

    const now = new Date().toISOString()
    const readings = sensors.map(s => ({
      sensor_id: s.id,
      value:     randomValue(s.type),
      recorded_at: now,
    }))

    const { error: insertError } = await supabase
      .from('sensor_readings')
      .insert(readings)

    if (insertError) {
      console.error('[sensor-simulate] Fehler beim Einfügen:', insertError.message)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    console.log(`[sensor-simulate] ${readings.length} Readings gespeichert`)
    return NextResponse.json({ ok: true, inserted: readings.length, at: now })

  } catch (err) {
    console.error('[sensor-simulate] Unhandled error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Interner Fehler' },
      { status: 500 }
    )
  }
}
