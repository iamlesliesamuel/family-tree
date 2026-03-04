import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface RouteContext {
  params: Promise<{ id: string; photoId: string }>
}

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id, photoId } = await context.params
  const body = (await req.json()) as { caption?: string }

  const { data, error } = await supabase
    .from('person_photos')
    .update({ caption: body.caption?.trim() || null })
    .eq('id', photoId)
    .eq('person_id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ photo: data })
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id, photoId } = await context.params

  const { data: photo, error: fetchError } = await supabase
    .from('person_photos')
    .select('*')
    .eq('id', photoId)
    .eq('person_id', id)
    .single()

  if (fetchError || !photo) {
    return NextResponse.json({ error: fetchError?.message ?? 'Photo not found' }, { status: 404 })
  }

  const dbDelete = await supabase.from('person_photos').delete().eq('id', photoId).eq('person_id', id)
  if (dbDelete.error) return NextResponse.json({ error: dbDelete.error.message }, { status: 400 })

  try {
    const admin = getSupabaseAdmin()
    await admin.storage.from('person-photos').remove([photo.storage_path])
  } catch {
    await supabase.storage.from('person-photos').remove([photo.storage_path])
  }

  return NextResponse.json({ ok: true })
}
