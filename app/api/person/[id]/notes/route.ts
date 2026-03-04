import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
  const body = (await req.json()) as { content?: string }

  const { data, error } = await supabase
    .from('person_notes')
    .upsert({
      person_id: id,
      content: body.content ?? '',
    }, { onConflict: 'person_id' })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ note: data })
}
