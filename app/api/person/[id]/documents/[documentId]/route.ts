import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface RouteContext {
  params: Promise<{ id: string; documentId: string }>
}

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id, documentId } = await context.params
  const body = (await req.json()) as { title?: string; document_type?: string }

  const patch: Record<string, string> = {}
  if (typeof body.title === 'string') patch.title = body.title.trim()
  if (typeof body.document_type === 'string') patch.document_type = body.document_type

  const { data, error } = await supabase
    .from('person_documents')
    .update(patch)
    .eq('id', documentId)
    .eq('person_id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ document: data })
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id, documentId } = await context.params

  const { data: doc, error: fetchError } = await supabase
    .from('person_documents')
    .select('*')
    .eq('id', documentId)
    .eq('person_id', id)
    .single()

  if (fetchError || !doc) {
    return NextResponse.json({ error: fetchError?.message ?? 'Document not found' }, { status: 404 })
  }

  const dbDelete = await supabase.from('person_documents').delete().eq('id', documentId).eq('person_id', id)
  if (dbDelete.error) return NextResponse.json({ error: dbDelete.error.message }, { status: 400 })

  try {
    const admin = getSupabaseAdmin()
    await admin.storage.from('family-documents').remove([doc.storage_path])
  } catch {
    await supabase.storage.from('family-documents').remove([doc.storage_path])
  }

  return NextResponse.json({ ok: true })
}
