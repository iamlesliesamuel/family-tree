import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { logAudit, logFieldDiffs } from '@/lib/audit'
import { getEditedBy } from '@/lib/request-meta'

export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

type PersonPatchPayload = {
  first_name?: unknown
  middle_name?: unknown
  last_name?: unknown
  maiden_name?: unknown
  birth_date?: unknown
  death_date?: unknown
  birth_place?: unknown
  gender?: unknown
  notes?: unknown
  archived?: unknown
  archived_reason?: unknown
  edited_by?: unknown
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required`)
  }
  return value.trim()
}

function asNullableDate(value: unknown): string | null {
  const text = asNullableString(value)
  if (!text) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new Error('Dates must use YYYY-MM-DD format')
  }
  return text
}

function normalizePersonPayload(payload: PersonPatchPayload) {
  return {
    first_name: asRequiredString(payload.first_name, 'first_name'),
    middle_name: asNullableString(payload.middle_name),
    last_name: asRequiredString(payload.last_name, 'last_name'),
    maiden_name: asNullableString(payload.maiden_name),
    birth_date: asNullableDate(payload.birth_date),
    death_date: asNullableDate(payload.death_date),
    birth_place: asNullableString(payload.birth_place),
    gender: asNullableString(payload.gender),
    notes: asNullableString(payload.notes),
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params

  try {
    const payload = (await req.json()) as PersonPatchPayload
    const editedBy = getEditedBy(req, payload.edited_by)
    const normalized = normalizePersonPayload(payload)

    const currentRes = await supabase.from('people').select('*').eq('id', id).single()
    if (currentRes.error || !currentRes.data) {
      return NextResponse.json({ error: currentRes.error?.message ?? 'Person not found' }, { status: 404 })
    }

    const allowedColumns = new Set(Object.keys(currentRes.data as Record<string, unknown>))
    const updateData: Record<string, unknown> = Object.fromEntries(
      Object.entries(normalized).filter(([key]) => allowedColumns.has(key))
    )
    if (typeof payload.archived === 'boolean' && allowedColumns.has('archived_at')) {
      updateData.archived_at = payload.archived ? new Date().toISOString() : null
    }
    if (typeof payload.archived_reason === 'string' && allowedColumns.has('archived_reason')) {
      updateData.archived_reason = payload.archived_reason.trim() || null
    }
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ person: currentRes.data })
    }

    const { data, error } = await supabase
      .from('people')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const action =
      updateData.archived_at !== undefined
        ? (updateData.archived_at ? 'archive' : 'restore')
        : 'update'

    await logFieldDiffs({
      entityType: 'people',
      entityId: id,
      personId: id,
      before: currentRes.data as Record<string, unknown>,
      after: data as Record<string, unknown>,
      editedBy,
    })

    if (action !== 'update') {
      await logAudit({
        entity_type: 'people',
        entity_id: id,
        person_id: id,
        action,
        edited_by: editedBy,
      })
    }

    return NextResponse.json({ person: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request payload'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const body = await req.json().catch(() => ({})) as { restore?: boolean; archived_reason?: string; edited_by?: string }
  const restore = body.restore === true
  const editedBy = getEditedBy(req, body.edited_by)

  const { data: current, error: fetchError } = await supabase.from('people').select('*').eq('id', id).single()
  if (fetchError || !current) {
    return NextResponse.json({ error: fetchError?.message ?? 'Person not found' }, { status: 404 })
  }

  const patch = {
    archived_at: restore ? null : new Date().toISOString(),
    archived_reason: restore ? null : (body.archived_reason?.trim() || 'Archived from UI'),
  }

  const { data, error } = await supabase
    .from('people')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logAudit({
    entity_type: 'people',
    entity_id: id,
    person_id: id,
    action: restore ? 'restore' : 'archive',
    edited_by: editedBy,
    new_value: patch.archived_reason,
  })

  return NextResponse.json({ person: data })
}
