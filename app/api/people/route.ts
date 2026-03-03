import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

type PersonPayload = {
  first_name?: unknown
  middle_name?: unknown
  last_name?: unknown
  maiden_name?: unknown
  birth_date?: unknown
  death_date?: unknown
  birth_place?: unknown
  gender?: unknown
  notes?: unknown
}

function extractMissingColumn(message: string): string | null {
  const match = message.match(/Could not find the '([^']+)' column/i)
  return match?.[1] ?? null
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

function normalizePersonPayload(payload: PersonPayload) {
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

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as PersonPayload
    let insertData: Record<string, string | null> = normalizePersonPayload(payload)

    while (true) {
      const { data, error } = await supabase
        .from('people')
        .insert(insertData)
        .select('*')
        .single()

      if (!error) {
        return NextResponse.json({ person: data }, { status: 201 })
      }

      const missingColumn = extractMissingColumn(error.message)
      if (missingColumn && missingColumn in insertData) {
        delete insertData[missingColumn]
        continue
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request payload'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
