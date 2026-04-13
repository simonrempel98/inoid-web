import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/sensors/ingest
 *
 * Nimmt Sensor-Messwerte entgegen. Authentifizierung via API-Key.
 *
 * Header:
 *   Authorization: Bearer {sensor_api_key}
 *   Content-Type: application/json
 *
 * Body (einzeln):
 *   { "sensor_id": "uuid", "value": 73.4, "recorded_at": "2024-01-01T10:00:00Z" }
 *
 * Body (Batch):
 *   { "readings": [
 *       { "sensor_id": "uuid1", "value": 73.4 },
 *       { "sensor_id": "uuid2", "value": 2.1, "recorded_at": "..." }
 *   ]}
 */
export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorization-Header fehlt (Bearer {api_key})' }, { status: 401 })
  }
  const apiKey = authHeader.slice(7).trim()

  const supabase = createAdminClient()

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('sensor_api_key', apiKey)
    .eq('is_active', true)
    .single()

  if (orgError || !org) {
    return NextResponse.json({ error: 'Ungültiger API-Key' }, { status: 401 })
  }

  // ── Body parsen ─────────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 })
  }

  // Einzelner Wert oder Batch
  const raw: { sensor_id?: string; value?: unknown; recorded_at?: string }[] =
    Array.isArray(body.readings)
      ? (body.readings as typeof raw)
      : [{ sensor_id: body.sensor_id as string, value: body.value, recorded_at: body.recorded_at as string | undefined }]

  if (!raw.length || !raw[0].sensor_id) {
    return NextResponse.json({ error: 'sensor_id und value sind erforderlich' }, { status: 400 })
  }

  // ── Sensoren validieren (müssen zur Org gehören) ────────────────────────────
  const sensorIds = [...new Set(raw.map(r => r.sensor_id).filter(Boolean))] as string[]

  const { data: validSensors } = await supabase
    .from('sensors')
    .select('id')
    .in('id', sensorIds)
    .eq('organization_id', org.id)
    .eq('is_active', true)

  const validSet = new Set((validSensors ?? []).map(s => s.id))

  const toInsert = raw
    .filter(r => r.sensor_id && validSet.has(r.sensor_id) && r.value !== undefined)
    .map(r => ({
      sensor_id: r.sensor_id as string,
      value: Number(r.value),
      recorded_at: r.recorded_at ?? new Date().toISOString(),
    }))

  if (!toInsert.length) {
    return NextResponse.json({ error: 'Keine gültigen Sensor-IDs gefunden' }, { status: 400 })
  }

  // ── Einfügen ────────────────────────────────────────────────────────────────
  const { error: insertError } = await supabase
    .from('sensor_readings')
    .insert(toInsert)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, inserted: toInsert.length })
}
