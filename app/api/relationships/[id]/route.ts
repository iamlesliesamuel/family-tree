import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

type RelationshipPatchPayload = {
  relationship_type?: unknown
  start_date?: unknown
  end_date?: unknown
  notes?: unknown
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

    const { data, error } = await supabase
      .from('relationships')
      .update({
        relationship_type: asRelationshipType(payload.relationship_type),
        start_date: asNullableDate(payload.start_date),
        end_date: asNullableDate(payload.end_date),
        notes: asNullableString(payload.notes),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ relationship: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request payload'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
