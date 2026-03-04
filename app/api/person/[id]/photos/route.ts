import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params

  const { data, error } = await supabase
    .from('person_photos')
    .select('*')
    .eq('person_id', id)
    .order('uploaded_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ photos: data ?? [] })
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const contentType = req.headers.get('content-type') ?? ''
  const admin = getSupabaseAdmin()

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
      .insert({ person_id: id, storage_path: storagePath, caption })
      .select('*')
      .single()

    if (insert.error) {
      await admin.storage.from('person-photos').remove([storagePath])
      return NextResponse.json({ error: insert.error.message }, { status: 400 })
    }

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
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ photo: data }, { status: 201 })
}
