import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logAudit } from '@/lib/audit'
import { getEditedBy } from '@/lib/request-meta'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const includeArchived = _req.nextUrl.searchParams.get('includeArchived') === '1'

  let query = supabase
    .from('person_photos')
    .select('id, person_id, storage_path, caption, is_profile, focus_x, focus_y, archived_at, uploaded_at')
    .eq('person_id', id)
    .order('uploaded_at', { ascending: false })
  if (!includeArchived) query = query.is('archived_at', null)
  let { data, error } = await query

  if (error && (error.message.toLowerCase().includes('focus_x') || error.message.toLowerCase().includes('focus_y'))) {
    let fallbackQuery = supabase
      .from('person_photos')
      .select('id, person_id, storage_path, caption, is_profile, archived_at, uploaded_at')
      .eq('person_id', id)
      .order('uploaded_at', { ascending: false })
    if (!includeArchived) fallbackQuery = fallbackQuery.is('archived_at', null)
    const fallback = await fallbackQuery

    data = (fallback.data ?? []).map((row) => ({ ...row, focus_x: 50, focus_y: 50 }))
    error = fallback.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ photos: data ?? [] })
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const contentType = req.headers.get('content-type') ?? ''
    const admin = getSupabaseAdmin()
    const editedBy = getEditedBy(req)

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const file = form.get('file')
      const captionValue = form.get('caption')
      const caption = typeof captionValue === 'string' && captionValue.trim() ? captionValue.trim() : null

      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'file is required' }, { status: 400 })
      }

      const fileExt = file.name.includes('.') ? file.name.split('.').pop() : undefined
      const safeExt = (fileExt ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const photoId = crypto.randomUUID()
      const storagePath = `${id}/${photoId}.${safeExt}`

      const upload = await admin.storage
        .from('person-photos')
        .upload(storagePath, file, { contentType: file.type || undefined, upsert: false })

      if (upload.error) {
        return NextResponse.json({ error: upload.error.message }, { status: 400 })
      }

      const insert = await admin
        .from('person_photos')
        .insert({
          person_id: id,
          storage_path: storagePath,
          caption,
          is_profile: false,
          focus_x: 50,
          focus_y: 50,
        })
        .select('*')
        .single()

      if (insert.error) {
        await admin.storage.from('person-photos').remove([storagePath])
        return NextResponse.json({ error: insert.error.message }, { status: 400 })
      }

      await logAudit({
        entity_type: 'person_photos',
        entity_id: insert.data.id,
        person_id: id,
        action: 'upload',
        edited_by: editedBy,
      })

      return NextResponse.json({ photo: insert.data }, { status: 201 })
    }

    const body = (await req.json()) as { storage_path?: string; caption?: string }
    if (!body.storage_path) {
      return NextResponse.json({ error: 'storage_path is required' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('person_photos')
      .insert({
        person_id: id,
        storage_path: body.storage_path,
        caption: body.caption?.trim() || null,
        is_profile: false,
        focus_x: 50,
        focus_y: 50,
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    await logAudit({
      entity_type: 'person_photos',
      entity_id: data.id,
      person_id: id,
      action: 'upload',
      edited_by: editedBy,
    })
    return NextResponse.json({ photo: data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload photo'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
