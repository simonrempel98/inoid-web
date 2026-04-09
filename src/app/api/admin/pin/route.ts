import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'crypto'

function hashPin(pin: string, salt: string): string {
  return pbkdf2Sync(pin, salt, 100_000, 32, 'sha256').toString('hex')
}

function createPinHash(pin: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = hashPin(pin, salt)
  return `${salt}:${hash}`
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const attempt = hashPin(pin, salt)
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(attempt, 'hex'))
  } catch {
    return false
  }
}

async function checkPlatformAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('is_platform_admin').eq('id', user.id).single()
  if (!profile?.is_platform_admin) return null
  return user
}

// PIN setzen oder ändern
export async function POST(req: NextRequest) {
  const user = await checkPlatformAdmin()
  if (!user) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { pin, currentPin } = await req.json()

  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN muss genau 4 Ziffern sein' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Wenn bereits ein PIN gesetzt ist, muss der aktuelle zuerst verifiziert werden
  const { data: profile } = await admin
    .from('profiles')
    .select('admin_pin_hash')
    .eq('id', user.id)
    .single()

  if (profile?.admin_pin_hash) {
    if (!currentPin) {
      return NextResponse.json({ error: 'Aktueller PIN erforderlich' }, { status: 400 })
    }
    if (!verifyPin(currentPin, profile.admin_pin_hash)) {
      return NextResponse.json({ error: 'Aktueller PIN falsch' }, { status: 401 })
    }
  }

  const pinHash = createPinHash(pin)
  const { error } = await admin
    .from('profiles')
    .update({ admin_pin_hash: pinHash })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// PIN verifizieren (für kritische Aktionen)
export async function PUT(req: NextRequest) {
  const user = await checkPlatformAdmin()
  if (!user) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const { pin } = await req.json()
  if (!pin || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ valid: false }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('admin_pin_hash')
    .eq('id', user.id)
    .single()

  if (!profile?.admin_pin_hash) {
    return NextResponse.json({ error: 'Kein PIN gesetzt. Bitte zuerst einen PIN einrichten.' }, { status: 400 })
  }

  const valid = verifyPin(pin, profile.admin_pin_hash)
  return NextResponse.json({ valid })
}
