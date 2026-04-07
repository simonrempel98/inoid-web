'use server'

import { createClient } from '@/lib/supabase/server'

export async function completeProfile(fullName: string, password: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nicht eingeloggt' }

  const { error: pwError } = await supabase.auth.updateUser({ password })
  if (pwError) return { error: pwError.message }

  await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)

  return { success: true }
}
