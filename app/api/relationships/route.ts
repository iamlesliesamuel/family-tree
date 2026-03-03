import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

type RelationshipPayload = {
  person1_id?: unknown
  person2_id?: unknown
  relationship_type?: unknown
  start_date?: unknown
  end_date?: unknown
  notes?: unknown
}

function asRequiredId(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required`)
  }
  return value.trim()
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

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as RelationshipPayload
    const person1Id = asRequiredId(payload.person1_id, 'person1_id')
    const person2Id = asRequiredId(payload.person2_id, 'person2_id')

    if (person1Id === person2Id) {
      return NextResponse.json({ error: 'person1_id and person2_id must be different' }, { status: 400 })
    }

    const firstCheck = await supabase
      .from('relationships')
      .select('*')
      .eq('person1_id', person1Id)
      .eq('person2_id', person2Id)
      .limit(1)

    const secondCheck = await supabase
      .from('relationships')
      .select('*')
      .eq('person1_id', person2Id)
      .eq('person2_id', person1Id)
      .limit(1)

    const existing = firstCheck.data?.[0] ?? secondCheck.data?.[0] ?? null
    if (existing) {
      return NextResponse.json({ relationship: existing })
    }

    const { data, error } = await supabase
      .from('relationships')
      .insert({
        person1_id: person1Id,
        person2_id: person2Id,
        relationship_type: asRelationshipType(payload.relationship_type),
        start_date: asNullableDate(payload.start_date),
        end_date: asNullableDate(payload.end_date),
        notes: asNullableString(payload.notes),
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ relationship: data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request payload'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
