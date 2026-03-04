import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface RouteContext {
  params: Promise<{ id: string }>
}

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params

  const { data, error } = await supabase
    .from('person_tags')
    .select('person_id, tag_id, tags(id, name, description)')
    .eq('person_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ personTags: data ?? [] })
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const body = (await req.json()) as { tag_id?: string }
  if (!body.tag_id) return NextResponse.json({ error: 'tag_id is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('person_tags')
    .insert({ person_id: id, tag_id: body.tag_id })
    .select('person_id, tag_id, tags(id, name, description)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ personTag: data }, { status: 201 })
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const tagId = req.nextUrl.searchParams.get('tagId')
  if (!tagId) return NextResponse.json({ error: 'tagId query param is required' }, { status: 400 })

  const { error } = await supabase
    .from('person_tags')
    .delete()
    .eq('person_id', id)
    .eq('tag_id', tagId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
