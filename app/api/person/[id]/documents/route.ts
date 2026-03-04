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
    .from('person_documents')
    .select('*')
    .eq('person_id', id)
    .order('uploaded_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ documents: data ?? [] })
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const contentType = req.headers.get('content-type') ?? ''
  const admin = getSupabaseAdmin()

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    const file = form.get('file')
    const titleValue = form.get('title')
    const documentTypeValue = form.get('document_type')
    const title = typeof titleValue === 'string' ? titleValue.trim() : ''
    const documentType = typeof documentTypeValue === 'string' && documentTypeValue.trim()
      ? documentTypeValue.trim()
      : 'other'

    if (!(file instanceof File) || !title) {
      return NextResponse.json({ error: 'file and title are required' }, { status: 400 })
    }

    const fileExt = file.name.includes('.') ? file.name.split('.').pop() : undefined
    const safeExt = (fileExt ?? 'pdf').toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf'
    const documentId = crypto.randomUUID()
    const storagePath = `${id}/${documentId}.${safeExt}`

    const upload = await admin.storage
      .from('family-documents')
      .upload(storagePath, file, { contentType: file.type || undefined, upsert: false })

    if (upload.error) {
      return NextResponse.json({ error: upload.error.message }, { status: 400 })
    }

    const insert = await admin
      .from('person_documents')
      .insert({
        person_id: id,
        title,
        storage_path: storagePath,
        document_type: documentType,
      })
      .select('*')
      .single()

    if (insert.error) {
      await admin.storage.from('family-documents').remove([storagePath])
      return NextResponse.json({ error: insert.error.message }, { status: 400 })
    }

    return NextResponse.json({ document: insert.data }, { status: 201 })
  }

  const body = (await req.json()) as {
    title?: string
    storage_path?: string
    document_type?: string
  }

  if (!body.title?.trim() || !body.storage_path) {
    return NextResponse.json({ error: 'title and storage_path are required' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('person_documents')
    .insert({
      person_id: id,
      title: body.title.trim(),
      storage_path: body.storage_path,
      document_type: body.document_type ?? 'other',
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ document: data }, { status: 201 })
}
