import { createClient } from '@/lib/supabase/server'
import type { AppRole } from './permissions'

export async function getRole(): Promise<AppRole> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'leser'
  const { data: profile } = await supabase
    .from('profiles')
    .select('app_role')
    .eq('id', user.id)
    .single()
  return (profile?.app_role as AppRole) ?? 'leser'
}
