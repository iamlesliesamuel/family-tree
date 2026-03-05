import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { logAudit, logFieldDiffs } from '@/lib/audit'
import { getEditedBy } from '@/lib/request-meta'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params

  const { data, error } = await supabase
    .from('person_notes')
    .select('*')
    .eq('person_id', id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ note: data ?? null })
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const body = (await req.json()) as { content?: string; edited_by?: string }
  const editedBy = getEditedBy(req, body.edited_by)

  const beforeRes = await supabase
    .from('person_notes')
    .select('*')
    .eq('person_id', id)
    .single()

  const { data, error } = await supabase
    .from('person_notes')
    .upsert({
      person_id: id,
      content: body.content ?? '',
    }, { onConflict: 'person_id' })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (beforeRes.error && beforeRes.error.code === 'PGRST116') {
    await logAudit({
      entity_type: 'person_notes',
      entity_id: data.id,
      person_id: id,
      action: 'create',
      edited_by: editedBy,
    })
  } else if (beforeRes.data) {
    await logFieldDiffs({
      entityType: 'person_notes',
      entityId: data.id,
      personId: id,
      before: beforeRes.data as Record<string, unknown>,
      after: data as Record<string, unknown>,
      editedBy,
      fields: ['content'],
    })
  }
  return NextResponse.json({ note: data })
}
