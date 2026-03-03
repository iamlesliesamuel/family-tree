import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

type ParentChildPayload = {
  parent_id?: unknown
  child_id?: unknown
  is_adopted?: unknown
}

function asRequiredId(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required`)
  }
  return value.trim()
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ParentChildPayload
    const parentId = asRequiredId(payload.parent_id, 'parent_id')
    const childId = asRequiredId(payload.child_id, 'child_id')
    const isAdopted = asBoolean(payload.is_adopted)

    if (parentId === childId) {
      return NextResponse.json({ error: 'parent_id and child_id must be different' }, { status: 400 })
    }

    const existing = await supabase
      .from('parent_child')
      .select('*')
      .eq('parent_id', parentId)
      .eq('child_id', childId)
      .limit(1)

    if ((existing.data ?? []).length > 0) {
      return NextResponse.json({ relation: existing.data?.[0] })
    }

    const { data, error } = await supabase
      .from('parent_child')
      .insert({
        parent_id: parentId,
        child_id: childId,
        is_adopted: isAdopted,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ relation: data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request payload'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
