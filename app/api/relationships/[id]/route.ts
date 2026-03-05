import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { logAudit, logFieldDiffs } from '@/lib/audit'
import { getEditedBy } from '@/lib/request-meta'

export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

type RelationshipPatchPayload = {
  relationship_type?: unknown
  start_date?: unknown
  end_date?: unknown
  notes?: unknown
  archived?: unknown
  edited_by?: unknown
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asRelationshipType(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) return 'partner'
  return value.trim().toLowerCase()
}

function asNullableDate(value: unknown): string | null {
  const text = asNullableString(value)
  if (!text) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error('Dates must use YYYY-MM-DD format')
  }
  return text
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    const payload = (await req.json()) as RelationshipPatchPayload
    const editedBy = getEditedBy(req, payload.edited_by)

    const beforeRes = await supabase.from('relationships').select('*').eq('id', id).single()
    if (beforeRes.error || !beforeRes.data) {
      return NextResponse.json({ error: beforeRes.error?.message ?? 'Relationship not found' }, { status: 404 })
    }

    const patch: Record<string, unknown> = {
      relationship_type: asRelationshipType(payload.relationship_type),
      start_date: asNullableDate(payload.start_date),
      end_date: asNullableDate(payload.end_date),
      notes: asNullableString(payload.notes),
    }
    if (typeof payload.archived === 'boolean') {
      patch.archived_at = payload.archived ? new Date().toISOString() : null
    }

    const { data, error } = await supabase
      .from('relationships')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await logFieldDiffs({
      entityType: 'relationships',
      entityId: id,
      personId: (data.person1_id as string) ?? null,
      before: beforeRes.data as Record<string, unknown>,
      after: data as Record<string, unknown>,
      editedBy,
    })

    if (typeof payload.archived === 'boolean') {
      await logAudit({
        entity_type: 'relationships',
        entity_id: id,
        person_id: (data.person1_id as string) ?? null,
        action: payload.archived ? 'archive' : 'restore',
        edited_by: editedBy,
      })
    }

    return NextResponse.json({ relationship: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request payload'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const body = await req.json().catch(() => ({})) as { restore?: boolean; edited_by?: string }
  const restore = body.restore === true
  const editedBy = getEditedBy(req, body.edited_by)

  const { data: rel, error: fetchError } = await supabase
    .from('relationships')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !rel) {
    return NextResponse.json({ error: fetchError?.message ?? 'Relationship not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('relationships')
    .update({ archived_at: restore ? null : new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logAudit({
    entity_type: 'relationships',
    entity_id: id,
    person_id: rel.person1_id,
    action: restore ? 'restore' : 'archive',
    edited_by: editedBy,
  })

  return NextResponse.json({ relationship: data })
}
