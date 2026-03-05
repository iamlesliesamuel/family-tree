import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { logAudit, logFieldDiffs } from '@/lib/audit'
import { getEditedBy } from '@/lib/request-meta'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const body = (await req.json()) as { is_adopted?: boolean; archived?: boolean; edited_by?: string }
  const editedBy = getEditedBy(req, body.edited_by)

  const { data: before, error: fetchError } = await supabase
    .from('parent_child')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !before) {
    return NextResponse.json({ error: fetchError?.message ?? 'Parent-child link not found' }, { status: 404 })
  }

  const patch: Record<string, unknown> = {}
  if (typeof body.is_adopted === 'boolean') patch.is_adopted = body.is_adopted
  if (typeof body.archived === 'boolean') patch.archived_at = body.archived ? new Date().toISOString() : null
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ relation: before })
  }

  const { data, error } = await supabase
    .from('parent_child')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logFieldDiffs({
    entityType: 'parent_child',
    entityId: id,
    personId: before.child_id,
    before: before as Record<string, unknown>,
    after: data as Record<string, unknown>,
    editedBy,
  })

  if (typeof body.archived === 'boolean') {
    await logAudit({
      entity_type: 'parent_child',
      entity_id: id,
      person_id: before.child_id,
      action: body.archived ? 'archive' : 'restore',
      edited_by: editedBy,
    })
  }

  return NextResponse.json({ relation: data })
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const body = await req.json().catch(() => ({})) as { restore?: boolean; edited_by?: string }
  const restore = body.restore === true
  const editedBy = getEditedBy(req, body.edited_by)

  const { data, error } = await supabase
    .from('parent_child')
    .update({ archived_at: restore ? null : new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Parent-child link not found' }, { status: 400 })

  await logAudit({
    entity_type: 'parent_child',
    entity_id: id,
    person_id: data.child_id,
    action: restore ? 'restore' : 'archive',
    edited_by: editedBy,
  })

  return NextResponse.json({ relation: data })
}
