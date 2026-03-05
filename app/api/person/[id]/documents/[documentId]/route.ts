import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { logAudit, logFieldDiffs } from '@/lib/audit'
import { getEditedBy } from '@/lib/request-meta'

interface RouteContext {
  params: Promise<{ id: string; documentId: string }>
}

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id, documentId } = await context.params
  const body = (await req.json()) as { title?: string; document_type?: string }
  const admin = getSupabaseAdmin()
  const editedBy = getEditedBy(req)

  const beforeRes = await admin
    .from('person_documents')
    .select('*')
    .eq('id', documentId)
    .eq('person_id', id)
    .single()
  if (beforeRes.error || !beforeRes.data) {
    return NextResponse.json({ error: beforeRes.error?.message ?? 'Document not found' }, { status: 404 })
  }

  const patch: Record<string, string> = {}
  if (typeof body.title === 'string') patch.title = body.title.trim()
  if (typeof body.document_type === 'string') patch.document_type = body.document_type

  const { data, error } = await admin
    .from('person_documents')
    .update(patch)
    .eq('id', documentId)
    .eq('person_id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await logFieldDiffs({
    entityType: 'person_documents',
    entityId: documentId,
    personId: id,
    before: beforeRes.data as Record<string, unknown>,
    after: data as Record<string, unknown>,
    editedBy,
  })
  return NextResponse.json({ document: data })
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id, documentId } = await context.params
  const admin = getSupabaseAdmin()
  const editedBy = getEditedBy(_req)
  const body = await _req.json().catch(() => ({})) as { restore?: boolean }
  const restore = body.restore === true

  const { data: doc, error: fetchError } = await admin
    .from('person_documents')
    .select('*')
    .eq('id', documentId)
    .eq('person_id', id)
    .single()

  if (fetchError || !doc) {
    return NextResponse.json({ error: fetchError?.message ?? 'Document not found' }, { status: 404 })
  }

  const { data, error } = await admin
    .from('person_documents')
    .update({ archived_at: restore ? null : new Date().toISOString() })
    .eq('id', documentId)
    .eq('person_id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logAudit({
    entity_type: 'person_documents',
    entity_id: documentId,
    person_id: id,
    action: restore ? 'restore' : 'archive',
    edited_by: editedBy,
  })

  return NextResponse.json({ document: data, ok: true })
}
