import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface RouteContext {
  params: Promise<{ id: string; photoId: string }>
}

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id, photoId } = await context.params
  const body = (await req.json()) as { caption?: string; is_profile?: boolean }
  const admin = getSupabaseAdmin()

  if (typeof body.is_profile === 'boolean' && body.is_profile) {
    const clear = await admin
      .from('person_photos')
      .update({ is_profile: false })
      .eq('person_id', id)
      .neq('id', photoId)

    if (clear.error) return NextResponse.json({ error: clear.error.message }, { status: 400 })
  }

  const patch: { caption?: string | null; is_profile?: boolean } = {}
  if (typeof body.caption === 'string') patch.caption = body.caption.trim() || null
  if (typeof body.is_profile === 'boolean') patch.is_profile = body.is_profile

  const { data, error } = await admin
    .from('person_photos')
    .update(patch)
    .eq('id', photoId)
    .eq('person_id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ photo: data })
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id, photoId } = await context.params
  const admin = getSupabaseAdmin()

  const { data: photo, error: fetchError } = await admin
    .from('person_photos')
    .select('*')
    .eq('id', photoId)
    .eq('person_id', id)
    .single()

  if (fetchError || !photo) {
    return NextResponse.json({ error: fetchError?.message ?? 'Photo not found' }, { status: 404 })
  }

  const dbDelete = await admin.from('person_photos').delete().eq('id', photoId).eq('person_id', id)
  if (dbDelete.error) return NextResponse.json({ error: dbDelete.error.message }, { status: 400 })

  await admin.storage.from('person-photos').remove([photo.storage_path])

  return NextResponse.json({ ok: true })
}
