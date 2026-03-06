import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logAudit, logFieldDiffs } from '@/lib/audit'
import { getEditedBy } from '@/lib/request-meta'

interface RouteContext {
  params: Promise<{ id: string; photoId: string }>
}

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id, photoId } = await context.params
  const body = (await req.json()) as {
    caption?: string
    is_profile?: boolean
    focus_x?: number
    focus_y?: number
  }
  const admin = getSupabaseAdmin()
  const editedBy = getEditedBy(req)

  const beforeRes = await admin
    .from('person_photos')
    .select('*')
    .eq('id', photoId)
    .eq('person_id', id)
    .single()
  if (beforeRes.error || !beforeRes.data) {
    return NextResponse.json({ error: beforeRes.error?.message ?? 'Photo not found' }, { status: 404 })
  }

  if (typeof body.is_profile === 'boolean' && body.is_profile) {
    const clear = await admin
      .from('person_photos')
      .update({ is_profile: false })
      .eq('person_id', id)
      .neq('id', photoId)

    if (clear.error) return NextResponse.json({ error: clear.error.message }, { status: 400 })
  }

  const patch: { caption?: string | null; is_profile?: boolean; focus_x?: number; focus_y?: number } = {}
  if (typeof body.caption === 'string') patch.caption = body.caption.trim() || null
  if (typeof body.is_profile === 'boolean') patch.is_profile = body.is_profile
  if (typeof body.focus_x === 'number' && Number.isFinite(body.focus_x)) {
    patch.focus_x = Math.min(100, Math.max(0, Math.round(body.focus_x)))
  }
  if (typeof body.focus_y === 'number' && Number.isFinite(body.focus_y)) {
    patch.focus_y = Math.min(100, Math.max(0, Math.round(body.focus_y)))
  }

  const { data, error } = await admin
    .from('person_photos')
    .update(patch)
    .eq('id', photoId)
    .eq('person_id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logFieldDiffs({
    entityType: 'person_photos',
    entityId: photoId,
    personId: id,
    before: beforeRes.data as Record<string, unknown>,
    after: data as Record<string, unknown>,
    editedBy,
  })
  return NextResponse.json({ photo: data })
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id, photoId } = await context.params
  const admin = getSupabaseAdmin()
  const editedBy = getEditedBy(_req)
  const body = await _req.json().catch(() => ({})) as { restore?: boolean }
  const restore = body.restore === true

  const { data: photo, error: fetchError } = await admin
    .from('person_photos')
    .select('*')
    .eq('id', photoId)
    .eq('person_id', id)
    .single()

  if (fetchError || !photo) {
    return NextResponse.json({ error: fetchError?.message ?? 'Photo not found' }, { status: 404 })
  }

  const { data, error } = await admin
    .from('person_photos')
    .update({ archived_at: restore ? null : new Date().toISOString() })
    .eq('id', photoId)
    .eq('person_id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logAudit({
    entity_type: 'person_photos',
    entity_id: photoId,
    person_id: id,
    action: restore ? 'restore' : 'archive',
    edited_by: editedBy,
  })

  return NextResponse.json({ photo: data, ok: true })
}
